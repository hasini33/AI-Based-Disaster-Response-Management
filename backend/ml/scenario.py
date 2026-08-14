from ml.predict_demand import predict_demand

def calculate_delay_factor(delay_days):
    """
    Calculate additional demand caused by response delay.
    """

    if delay_days < 0:
        raise ValueError(
            "Delay days cannot be negative."
        )

    delay_factor = 1 + (0.05 * delay_days)

    return delay_factor


def simulate_scenario(
    demand,
    available_percentage=100,
    delay_days=0,
):
    """
    Simulate resource demand under a
    response delay and resource availability scenario.
    """

    if available_percentage < 0:
        raise ValueError(
            "Available percentage cannot be negative."
        )

    if available_percentage > 100:
        raise ValueError(
            "Available percentage cannot exceed 100."
        )

    delay_factor = calculate_delay_factor(
        delay_days
    )

    scenario_result = {}

    for resource, required_amount in demand.items():

        # Adjust demand because of response delay
        projected_demand = (
            required_amount * delay_factor
        )

        # Calculate available resources
        available_amount = (
            required_amount
            * available_percentage
            / 100
        )

        # Calculate shortage
        shortage = max(
            0,
            projected_demand - available_amount
        )

        # Calculate surplus
        surplus = max(
            0,
            available_amount - projected_demand
        )

        scenario_result[resource] = {
            "original_demand": round(
                required_amount,
                2
            ),

            "projected_demand": round(
                projected_demand,
                2
            ),

            "available_resources": round(
                available_amount,
                2
            ),

            "shortage": round(
                shortage,
                2
            ),

            "surplus": round(
                surplus,
                2
            ),
        }

    return {
        "delay_days": delay_days,
        "delay_factor": round(
            delay_factor,
            2
        ),
        "available_percentage": (
            available_percentage
        ),
        "resources": scenario_result,
    }


# ---------------------------------------------------
# Test scenario
# ---------------------------------------------------

if __name__ == "__main__":

    print("\nGENERATING ACTUAL DEMAND")
    print("============================")

    prediction = predict_demand(
        disaster_type="Flood",
        severity_score=75,
        population=8000,
        damage_percent=60,
        buildings_affected=350,
        elderly_percent=18,
        children_percent=25,
        medically_dependent_percent=6,
    )

    demand = prediction["adjusted_demand"]

    print("\nADJUSTED ML DEMAND")
    print("----------------------------")

    for resource, value in demand.items():
        print(f"{resource}: {value}")

    print("\nSCENARIO SIMULATION")
    print("============================")

    result = simulate_scenario(
        demand=demand,
        available_percentage=60,
        delay_days=3,
    )

    print(
        f"Response delay: "
        f"{result['delay_days']} days"
    )

    print(
        f"Delay factor: "
        f"{result['delay_factor']}"
    )

    print(
        f"Resource availability: "
        f"{result['available_percentage']}%"
    )

    print("\nRESOURCE IMPACT")
    print("----------------------------")

    for resource, values in result[
        "resources"
    ].items():

        print(f"\n{resource}")

        print(
            f"Original demand: "
            f"{values['original_demand']}"
        )

        print(
            f"Projected demand: "
            f"{values['projected_demand']}"
        )

        print(
            f"Available: "
            f"{values['available_resources']}"
        )

        print(
            f"Shortage: "
            f"{values['shortage']}"
        )

        print(
            f"Surplus: "
            f"{values['surplus']}"
        )