from sqlalchemy.orm import Session

from app.models.depot import Depot
from app.models.resource import Resource


def create_depots_from_resources(db: Session):

    resources = (
        db.query(Resource)
        .filter(
            Resource.latitude.isnot(None),
            Resource.longitude.isnot(None)
        )
        .all()
    )

    created = []

    for resource in resources:

        # Only create a depot for resources
        # that actually have a usable location.
        existing = (
            db.query(Depot)
            .filter(
                Depot.depot_name
                == resource.resource_name
            )
            .first()
        )

        if existing:
            continue

        depot = Depot(
            depot_name=resource.resource_name,
            latitude=resource.latitude,
            longitude=resource.longitude,
            status="Available"
        )

        db.add(depot)
        created.append(depot)

    db.commit()

    return created