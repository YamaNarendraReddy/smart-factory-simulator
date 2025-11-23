import pytest
from datetime import datetime, timedelta
from app.simulator import VirtualMachine, FactorySimulator

def test_virtual_machine_initialization():
    vm = VirtualMachine(1, "CNC")
    assert vm.id == 1
    assert vm.type == "CNC"
    assert vm.status == "idle"
    assert vm.health == 100.0
    assert vm.vibration == 0.0
    assert vm.temperature == 25.0

def test_virtual_machine_update():
    vm = VirtualMachine(1, "CNC")
    vm.status = "running"
    initial_health = vm.health
    vm.update(3600)  # 1 hour
    assert vm.health < initial_health
    assert vm.temperature > 25.0
    assert vm.vibration > 0.0

def test_virtual_machine_maintenance():
    vm = VirtualMachine(1, "CNC")
    vm.health = 50.0
    vm.perform_maintenance()
    assert vm.health > 50.0
    assert vm.health <= 90.0

def test_factory_simulator():
    factory = FactorySimulator(3)
    assert len(factory.machines) == 3
    status = factory.get_status()
    assert len(status["machines"]) == 3
    assert "timestamp" in status

def test_factory_update():
    factory = FactorySimulator(2)
    initial_time = factory.simulation_time
    factory.update()
    assert factory.simulation_time > initial_time
