"""
CLI command to seed the Dayliff 1000 Eyes database.
Usage: python -m app.seed.cli [--count 200] [--clear]
"""
import click
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal, engine, Base
from app.models import *  # noqa: import all models for create_all
from app.seed.generate import (
    generate_customers, generate_requests_and_journeys,
    generate_sla_configs, generate_departments,
)
from app.models.customer import Customer
from app.models.service_request import ServiceRequest
from app.models.event import Event
from app.models.journey_stage import JourneyStage
from app.models.department import Department, SLAConfig
from datetime import datetime, timezone


@click.command()
@click.option("--count", default=200, help="Number of service requests to generate")
@click.option("--clear", is_flag=True, help="Clear existing data before seeding")
def seed(count: int, clear: bool):
    """Seed the database with synthetic Dayliff operational data."""
    click.echo("Dayliff 1000 Eyes - Database Seeder")
    click.echo("=" * 50)

    # Create tables
    click.echo("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if clear:
            click.echo("Clearing existing data...")
            db.query(Event).delete()
            db.query(JourneyStage).delete()
            db.query(ServiceRequest).delete()
            db.query(Customer).delete()
            db.query(SLAConfig).delete()
            db.query(Department).delete()
            db.commit()
            click.echo("  ✓ Data cleared")

        # Departments & SLA Configs
        click.echo("Seeding departments and SLA configs...")
        for dept_data in generate_departments():
            dept = Department(**dept_data)
            db.add(dept)
        for sla_data in generate_sla_configs():
            sla = SLAConfig(**sla_data)
            db.add(sla)
        db.commit()
        click.echo("  ✓ Departments and SLA configs seeded")

        # Customers
        n_customers = max(30, count // 4)
        click.echo(f"Generating {n_customers} customers...")
        customer_data = generate_customers(n_customers)
        for c_data in customer_data:
            customer = Customer(
                id=c_data["id"],
                name=c_data["name"],
                email=c_data["email"],
                phone=c_data["phone"],
                region=c_data["region"],
                company=c_data["company"],
            )
            db.add(customer)
        db.commit()
        click.echo(f"  ✓ {n_customers} customers seeded")

        # Service Requests, Journey Stages, Events
        click.echo(f"Generating {count} service requests with full journeys...")
        requests, stages, events = generate_requests_and_journeys(customer_data, count)

        for req_data in requests:
            req = ServiceRequest(
                id=req_data["id"],
                customer_id=req_data["customer_id"],
                product_category=req_data["product_category"],
                priority=req_data["priority"],
                current_stage=req_data["current_stage"],
                assigned_department=req_data["assigned_department"],
                status=req_data["status"],
                description=req_data["description"],
                crm_reference=req_data["crm_reference"],
                erp_reference=req_data["erp_reference"],
                created_at=datetime.fromisoformat(req_data["created_at"]),
                updated_at=datetime.fromisoformat(req_data["updated_at"]),
            )
            db.add(req)
        db.commit()
        click.echo(f"  ✓ {len(requests)} service requests seeded")

        for stage_data in stages:
            stage = JourneyStage(
                id=stage_data["id"],
                request_id=stage_data["request_id"],
                stage_name=stage_data["stage_name"],
                department=stage_data["department"],
                started_at=datetime.fromisoformat(stage_data["started_at"]),
                completed_at=datetime.fromisoformat(stage_data["completed_at"]) if stage_data["completed_at"] else None,
                sla_deadline=datetime.fromisoformat(stage_data["sla_deadline"]) if stage_data["sla_deadline"] else None,
                status=stage_data["status"],
                sla_percentage=stage_data["sla_percentage"],
                assigned_to=stage_data["assigned_to"],
            )
            db.add(stage)
        db.commit()
        click.echo(f"  ✓ {len(stages)} journey stages seeded")

        for event_data in events:
            event = Event(
                id=event_data["id"],
                request_id=event_data["request_id"],
                event_type=event_data["event_type"],
                stage=event_data["stage"],
                source_system=event_data["source_system"],
                actor=event_data["actor"],
                description=event_data["description"],
                timestamp=datetime.fromisoformat(event_data["timestamp"]),
                metadata_json=event_data["metadata_json"],
            )
            db.add(event)
        db.commit()
        click.echo(f"  ✓ {len(events)} events seeded")

        click.echo()
        click.echo("=" * 50)
        click.echo("✅ Seeding complete!")
        click.echo(f"   Customers:       {n_customers}")
        click.echo(f"   Service Requests: {len(requests)}")
        click.echo(f"   Journey Stages:   {len(stages)}")
        click.echo(f"   Events:           {len(events)}")

    except Exception as e:
        db.rollback()
        click.echo(f"❌ Error: {e}", err=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
