"""
Driving Score Calculator
Calculates driving scores based on performance metrics from video analysis.
"""

def calculate_driving_score(metrics):
    """
    Calculates driving scores based on performance metrics.

    Args:
        metrics (dict): A dictionary containing driving data like:
                        - 'close_encounters': Number of close encounters
                        - 'traffic_violations': Number of traffic signal violations
                        - 'bus_lane_violations': Number of bus lane violations
                        - 'lane_changes': Number of lane changes

    Returns:
        dict: A dictionary with safety, compliance, efficiency,
              and the overall driving score.
    """
    # 1. Calculate Safety Score
    # Deduct 8 points for each close encounter
    safety_deductions = metrics.get('close_encounters', 0) * 8
    safety_score = max(0, 100 - safety_deductions)

    # 2. Calculate Compliance Score
    # Deduct 40 points for each traffic violation, 30 for bus lane violations
    traffic_violation_deductions = metrics.get('traffic_violations', 0) * 40
    bus_lane_deductions = metrics.get('bus_lane_violations', 0) * 30
    compliance_score = max(0, 100 - traffic_violation_deductions - bus_lane_deductions)

    # 3. Calculate Efficiency Score
    # Deduct 0.5 points for each lane change
    efficiency_deductions = metrics.get('lane_changes', 0) * 0.5
    efficiency_score = max(0, 100 - efficiency_deductions)

    # 4. Calculate Final Weighted Score
    # Safety: 50%, Compliance: 30%, Efficiency: 20%
    overall_score = (safety_score * 0.5) + (compliance_score * 0.3) + (efficiency_score * 0.2)

    return {
        'safety_score': round(safety_score),
        'compliance_score': round(compliance_score),
        'efficiency_score': round(efficiency_score),
        'overall_driving_score': round(overall_score)
    }


def calculate_score_from_analysis(analysis_data):
    """
    Extract metrics from video analysis data and calculate scores.
    
    Args:
        analysis_data (dict): The analysis data from merged_output_analysis.json
        
    Returns:
        dict: Calculated scores
    """
    metrics = {
        'close_encounters': analysis_data.get('close_encounters', {}).get('event_count', 0),
        'traffic_violations': 1 if analysis_data.get('traffic_signal_summary', {}).get('violation', False) else 0,
        'bus_lane_violations': 1 if analysis_data.get('illegal_way_bus_lane', {}).get('violation_detected', False) else 0,
        'lane_changes': analysis_data.get('lane_change_count', {}).get('turn_count', 0)
    }
    
    return calculate_driving_score(metrics)


def get_score_category(overall_score):
    """
    Get the category and description for a given score.
    
    Args:
        overall_score (int): The overall driving score
        
    Returns:
        dict: Category and description
    """
    if overall_score >= 90:
        return {
            'category': 'Excellent',
            'description': 'Outstanding performance exceeding safety standards',
            'color': 'green'
        }
    elif overall_score >= 75:
        return {
            'category': 'Good',
            'description': 'Good performance with minor improvement opportunities',
            'color': 'amber'
        }
    else:
        return {
            'category': 'Needs Improvement',
            'description': 'Performance requires attention and safety improvements',
            'color': 'red'
        }


if __name__ == "__main__":
    # Example usage with Dashcam001 data
    print("=== Dashcam001 Example ===")
    dashcam001_metrics = {
        'close_encounters': 1,
        'traffic_violations': 1,
        'bus_lane_violations': 0,
        'lane_changes': 4
    }
    
    scores = calculate_driving_score(dashcam001_metrics)
    print(f"Metrics: {dashcam001_metrics}")
    print(f"Scores: {scores}")
    
    category = get_score_category(scores['overall_driving_score'])
    print(f"Category: {category['category']} - {category['description']}")
    print()
    
    # Example from the original documentation (poor performance)
    print("=== Poor Performance Example ===")
    poor_driver_data = {
        'close_encounters': 13,
        'traffic_violations': 1,
        'bus_lane_violations': 1,
        'lane_changes': 37
    }
    
    poor_scores = calculate_driving_score(poor_driver_data)
    print(f"Metrics: {poor_driver_data}")
    print(f"Scores: {poor_scores}")
    # Expected Output: {'safety_score': 0, 'compliance_score': 30, 'efficiency_score': 82, 'overall_driving_score': 25}
    
    category = get_score_category(poor_scores['overall_driving_score'])
    print(f"Category: {category['category']} - {category['description']}")
    print()
    
    # Example: Excellent driver
    print("=== Excellent Performance Example ===")
    excellent_driver_data = {
        'close_encounters': 0,
        'traffic_violations': 0,
        'bus_lane_violations': 0,
        'lane_changes': 3
    }
    
    excellent_scores = calculate_driving_score(excellent_driver_data)
    print(f"Metrics: {excellent_driver_data}")
    print(f"Scores: {excellent_scores}")
    
    category = get_score_category(excellent_scores['overall_driving_score'])
    print(f"Category: {category['category']} - {category['description']}")
