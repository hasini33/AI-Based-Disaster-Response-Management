from sqlalchemy.orm import Session

from app.models.mission import Mission
from app.models.vehicle import Vehicle
from app.models.zone import Zone
from app.services.route_optimization_service import optimize_vehicle_routes


def create_missions_from_optimized_routes(
    db: Session
):
    """
    Convert optimized vehicle routes into mission records.
    """

    optimization_result = optimize_vehicle_routes(db)

    if not optimization_result:
        return {
            "status": "failed",
            "message": "Route optimization failed"
        }

    if optimization_result.get("status") != "optimized":
        return optimization_result

    routes = optimization_result.get(
        "routes",
        []
    )

    created_missions = []

    for route in routes:

        vehicle_id = route.get(
            "vehicle_id"
        )

        vehicle_name = route.get(
            "vehicle_name"
        )

        zones = route.get(
            "zones",
            []
        )

        # Ignore vehicles with no assigned zones
        if not zones:
            continue

        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.id == vehicle_id
            )
            .first()
        )

        if not vehicle:
            continue

        for zone_data in zones:

            zone_id = zone_data.get(
                "zone_id"
            )

            zone_name = zone_data.get(
                "zone_name"
            )

            allocated = float(
                zone_data.get(
                    "allocated",
                    0
                )
            )

            severity = float(
                zone_data.get(
                    "severity",
                    0
                )
            )

            if allocated <= 0:
                continue

            # Avoid creating duplicate pending missions
            existing = (
                db.query(Mission)
                .filter(
                    Mission.vehicle_id == vehicle_id,
                    Mission.zone_id == zone_id,
                    Mission.status == "Pending"
                )
                .first()
            )

            if existing:
                continue

            mission = Mission(
                zone_id=zone_id,
                zone_name=zone_name,
                vehicle_id=vehicle_id,
                vehicle_name=vehicle_name,
                resource_type=vehicle.vehicle_type,
                quantity=allocated,
                priority=severity,
                distance_km=route.get(
                    "distance_km",
                    0
                ),
                travel_time_minutes=None,
                status="Pending"
            )

            db.add(mission)

            created_missions.append(
                mission
            )

    db.commit()

    for mission in created_missions:
        db.refresh(mission)

    return {
        "status": "success",
        "message": "Missions created successfully",
        "total_missions": len(
            created_missions
        ),
        "missions": created_missions
    }


def get_missions(
    db: Session
):
    """
    Get all missions ordered by priority.
    """

    missions = (
        db.query(Mission)
        .order_by(
            Mission.priority.desc(),
            Mission.id.desc()
        )
        .all()
    )

    return {
        "total": len(missions),
        "missions": missions
    }


def update_mission_status(
    db: Session,
    mission_id: int,
    status: str
):
    """
    Update mission status using a controlled
    disaster-response workflow.
    """

    allowed_statuses = [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled"
    ]

    if status not in allowed_statuses:
        return None

    mission = (
        db.query(Mission)
        .filter(
            Mission.id == mission_id
        )
        .first()
    )

    if not mission:
        return None

    current_status = mission.status

    # -------------------------------------------------
    # Allowed mission transitions
    # -------------------------------------------------

    allowed_transitions = {

        "Pending": [
            "Assigned",
            "Cancelled"
        ],

        "Assigned": [
            "In Progress",
            "Cancelled"
        ],

        "In Progress": [
            "Completed",
            "Cancelled"
        ],

        "Completed": [],

        "Cancelled": []
    }

    if status not in allowed_transitions.get(
        current_status,
        []
    ):

        return None

    mission.status = status

    db.commit()
    db.refresh(mission)

    return mission