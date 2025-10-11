#!/usr/bin/env python3
"""
Model Manager - Download and manage YOLO models
"""

import os
import sys
import json
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CONFIG_FILE = SCRIPT_DIR / "analysis_config.json"

MODEL_URLS = {
    "yolov8n.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt",
    "yolov8s.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt",
    "yolov8m.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt",
    "yolov8l.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8l.pt",
    "yolov8x.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x.pt",
}

def load_config():
    """Load analysis configuration"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_config(config):
    """Save analysis configuration"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def list_models():
    """List available models"""
    config = load_config()
    available_models = config.get('available_models', {})
    
    print("\n" + "="*70)
    print("Available YOLO Models")
    print("="*70)
    
    current_model = config.get('model', {}).get('name', 'yolov8n.pt')
    
    for model_file, info in available_models.items():
        model_path = SCRIPT_DIR / model_file
        exists = "✅" if model_path.exists() else "❌"
        current = "👉 CURRENT" if model_file == current_model else ""
        
        print(f"\n{exists} {model_file} {current}")
        print(f"   Name: {info['name']}")
        print(f"   Size: {info['size_mb']} MB")
        print(f"   Speed: {info['speed']}")
        print(f"   Accuracy: {info['accuracy']} (mAP: {info['mAP']})")
        print(f"   {info['description']}")
    
    print("\n" + "="*70)
    print(f"Current Model: {current_model}")
    print("="*70 + "\n")

def download_model(model_name):
    """Download a YOLO model"""
    if model_name not in MODEL_URLS:
        print(f"❌ Unknown model: {model_name}")
        print(f"Available models: {', '.join(MODEL_URLS.keys())}")
        return False
    
    url = MODEL_URLS[model_name]
    output_path = SCRIPT_DIR / model_name
    
    if output_path.exists():
        print(f"✅ Model {model_name} already exists")
        return True
    
    print(f"📥 Downloading {model_name}...")
    print(f"   URL: {url}")
    
    try:
        def progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = (downloaded / total_size) * 100 if total_size > 0 else 0
            mb_downloaded = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            print(f"\r   Progress: {percent:.1f}% ({mb_downloaded:.1f}/{mb_total:.1f} MB)", end='')
        
        urllib.request.urlretrieve(url, output_path, progress)
        print("\n✅ Download complete!")
        return True
    
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        if output_path.exists():
            output_path.unlink()
        return False

def set_model(model_name):
    """Set the active model"""
    model_path = SCRIPT_DIR / model_name
    
    if not model_path.exists():
        print(f"❌ Model {model_name} not found")
        print(f"   Run: python3 model_manager.py download {model_name}")
        return False
    
    config = load_config()
    if 'model' not in config:
        config['model'] = {}
    
    config['model']['name'] = model_name
    save_config(config)
    
    print(f"✅ Active model set to: {model_name}")
    return True

def get_recommendations():
    """Get model recommendations based on use case"""
    print("\n" + "="*70)
    print("Model Recommendations")
    print("="*70)
    
    print("\n🎯 Best for Most Users:")
    print("   yolov8s.pt - Best balance of speed and accuracy")
    print("   Download: python3 model_manager.py download yolov8s.pt")
    
    print("\n⚡ Best for Speed (Real-time Processing):")
    print("   yolov8n.pt - Fastest, good enough accuracy")
    print("   Download: python3 model_manager.py download yolov8n.pt")
    
    print("\n🎯 Best for Accuracy (Offline Analysis):")
    print("   yolov8m.pt - High accuracy, moderate speed")
    print("   Download: python3 model_manager.py download yolov8m.pt")
    
    print("\n🏆 Best for Maximum Accuracy (GPU Required):")
    print("   yolov8l.pt or yolov8x.pt - Highest accuracy")
    print("   Download: python3 model_manager.py download yolov8l.pt")
    
    print("\n" + "="*70 + "\n")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 model_manager.py list              - List all models")
        print("  python3 model_manager.py download <model>  - Download a model")
        print("  python3 model_manager.py set <model>       - Set active model")
        print("  python3 model_manager.py recommend         - Get recommendations")
        print("")
        print("Examples:")
        print("  python3 model_manager.py download yolov8s.pt")
        print("  python3 model_manager.py set yolov8s.pt")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "list":
        list_models()
    
    elif command == "download":
        if len(sys.argv) < 3:
            print("❌ Please specify model name")
            print("   Example: python3 model_manager.py download yolov8s.pt")
            sys.exit(1)
        
        model_name = sys.argv[2]
        if download_model(model_name):
            print(f"\n💡 To use this model, run:")
            print(f"   python3 model_manager.py set {model_name}")
    
    elif command == "set":
        if len(sys.argv) < 3:
            print("❌ Please specify model name")
            print("   Example: python3 model_manager.py set yolov8s.pt")
            sys.exit(1)
        
        model_name = sys.argv[2]
        set_model(model_name)
    
    elif command == "recommend":
        get_recommendations()
    
    else:
        print(f"❌ Unknown command: {command}")
        print("   Valid commands: list, download, set, recommend")
        sys.exit(1)

if __name__ == "__main__":
    main()
