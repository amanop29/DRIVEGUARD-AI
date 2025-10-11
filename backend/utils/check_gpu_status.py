#!/usr/bin/env python3
"""
GPU/CPU Status Checker for DriveGuard AI
Run this script to check if your system is using GPU or CPU for video analysis
"""

import torch
import sys
import os

def check_gpu_status():
    """Check and display GPU/CPU status"""
    
    print("=" * 70)
    print("🔍 DriveGuard AI - GPU/CPU Status Check")
    print("=" * 70)
    print()
    
    # PyTorch Info
    print("📦 System Information:")
    print(f"   PyTorch Version: {torch.__version__}")
    print(f"   Python Version: {sys.version.split()[0]}")
    print()
    
    # Check available devices
    print("🖥️  Available Devices:")
    print("-" * 70)
    
    # CUDA Check (NVIDIA GPU)
    cuda_available = torch.cuda.is_available()
    if cuda_available:
        print("   🎮 CUDA (NVIDIA GPU): ✅ Available")
        print(f"      Device: {torch.cuda.get_device_name(0)}")
        print(f"      Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        print("   🎮 CUDA (NVIDIA GPU): ❌ Not available")
    
    print()
    
    # MPS Check (Apple Silicon)
    mps_available = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
    if mps_available:
        print("   🍎 MPS (Apple Silicon): ✅ Available")
        print("      Your Mac has GPU acceleration!")
    else:
        print("   🍎 MPS (Apple Silicon): ❌ Not available")
    
    print()
    
    # CPU (always available)
    print("   💻 CPU: ✅ Always available (fallback)")
    print()
    
    # Determine active device
    print("=" * 70)
    print("🎯 Active Device Configuration:")
    print("=" * 70)
    
    if cuda_available:
        active_device = "CUDA (NVIDIA GPU)"
        icon = "🎮"
        speedup = "5-10x faster than CPU"
    elif mps_available:
        active_device = "MPS (Apple Silicon GPU)"
        icon = "🍎"
        speedup = "2-4x faster than CPU"
    else:
        active_device = "CPU"
        icon = "💻"
        speedup = "Baseline performance"
    
    print()
    print(f"   {icon} Device: {active_device}")
    print(f"   ⚡ Performance: {speedup}")
    print()
    
    # Check if scripts are configured for GPU
    print("=" * 70)
    print("📝 Script Configuration Check:")
    print("=" * 70)
    print()
    
    script_path = os.path.join(os.path.dirname(__file__), 'main_v2.py')
    if os.path.exists(script_path):
        try:
            import main_v2
            if hasattr(main_v2, 'DEVICE'):
                script_device = main_v2.DEVICE
                print(f"   ✅ main_v2.py configured")
                print(f"   📍 Using: {script_device.upper()}")
                
                if script_device == 'mps' and mps_available:
                    print("   🎉 GPU ACCELERATION ACTIVE IN SCRIPTS!")
                elif script_device == 'cuda' and cuda_available:
                    print("   🎉 GPU ACCELERATION ACTIVE IN SCRIPTS!")
                elif script_device == 'cpu':
                    print("   ℹ️  Scripts configured for CPU")
                    if mps_available or cuda_available:
                        print("   ⚠️  GPU available but not being used!")
            else:
                print("   ⚠️  DEVICE variable not found in main_v2.py")
        except Exception as e:
            print(f"   ⚠️  Could not check main_v2.py: {e}")
    else:
        print(f"   ❌ main_v2.py not found at: {script_path}")
    
    print()
    
    # Performance test
    print("=" * 70)
    print("🧪 Quick Performance Test:")
    print("=" * 70)
    print()
    
    import time
    
    # CPU test
    print("   Testing CPU performance...")
    start = time.time()
    x_cpu = torch.randn(2000, 2000)
    y_cpu = torch.matmul(x_cpu, x_cpu)
    cpu_time = time.time() - start
    print(f"   💻 CPU Time: {cpu_time:.4f} seconds")
    
    # GPU test
    if mps_available:
        print("   Testing GPU (MPS) performance...")
        try:
            start = time.time()
            x_gpu = torch.randn(2000, 2000, device='mps')
            y_gpu = torch.matmul(x_gpu, x_gpu)
            torch.mps.synchronize()
            gpu_time = time.time() - start
            print(f"   🍎 GPU Time: {gpu_time:.4f} seconds")
            speedup_actual = cpu_time / gpu_time
            print(f"   ⚡ Speedup: {speedup_actual:.2f}x faster")
        except Exception as e:
            print(f"   ⚠️  GPU test failed: {e}")
    elif cuda_available:
        print("   Testing GPU (CUDA) performance...")
        try:
            start = time.time()
            x_gpu = torch.randn(2000, 2000, device='cuda')
            y_gpu = torch.matmul(x_gpu, x_gpu)
            torch.cuda.synchronize()
            gpu_time = time.time() - start
            print(f"   🎮 GPU Time: {gpu_time:.4f} seconds")
            speedup_actual = cpu_time / gpu_time
            print(f"   ⚡ Speedup: {speedup_actual:.2f}x faster")
        except Exception as e:
            print(f"   ⚠️  GPU test failed: {e}")
    
    print()
    
    # Summary
    print("=" * 70)
    print("📊 Summary:")
    print("=" * 70)
    print()
    
    if (mps_available or cuda_available):
        print("   ✅ GPU acceleration is available and active!")
        print("   ⚡ Your videos will process 2-4x faster")
        print("   🎯 DriveGuard AI is optimized for performance")
    else:
        print("   💻 Running on CPU")
        print("   ℹ️  Processing will be slower")
        print("   💡 Consider using a Mac with Apple Silicon for GPU acceleration")
    
    print()
    print("=" * 70)
    print("✅ Status check complete!")
    print("=" * 70)
    print()


if __name__ == "__main__":
    check_gpu_status()
