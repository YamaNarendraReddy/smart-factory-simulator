import random
import time
from datetime import datetime, timedelta

class VirtualMachine:
    def __init__(self, machine_id, machine_type="CNC"):
        self.id = machine_id
        self.type = machine_type
        self.status = "idle"  # running, idle, error
        self.health = 100.0
        self.vibration = 0.0
        self.temperature = 25.0
        self.last_maintenance = datetime.utcnow()
        self.operating_hours = 0
        
    def update(self, delta_time):
        """Update machine state based on time delta"""
        if self.status == "running":
            self.operating_hours += delta_time / 3600
            self.health -= random.uniform(0.01, 0.05) * (delta_time / 3600)
            self.temperature = 30 + random.uniform(-2, 2) + (100 - self.health) * 0.3
            self.vibration = random.uniform(0.1, 0.5) + (100 - self.health) * 0.01
            
            if random.random() < 0.0001 * (1 - (self.health / 100)):
                self.status = "error"
                
    def perform_maintenance(self):
        """Perform maintenance on the machine"""
        self.health = min(100, self.health + random.uniform(20, 40))
        self.last_maintenance = datetime.utcnow()
        if self.status == "error":
            self.status = "idle"
            
    def start(self):
        if self.status != "error":
            self.status = "running"
            
    def stop(self):
        if self.status == "running":
            self.status = "idle"

class FactorySimulator:
    def __init__(self, num_machines=5):
        self.machines = [VirtualMachine(i) for i in range(num_machines)]
        self.simulation_time = datetime.utcnow()
        self.last_update = time.time()
        
    def update(self):
        """Update the simulation"""
        current_time = time.time()
        delta_time = current_time - self.last_update
        self.last_update = current_time
        
        self.simulation_time += timedelta(seconds=delta_time)
        
        for machine in self.machines:
            machine.update(delta_time)
            
    def get_status(self):
        """Get current status of all machines"""
        return {
            "timestamp": self.simulation_time.isoformat(),
            "machines": [
                {
                    "id": m.id,
                    "type": m.type,
                    "status": m.status,
                    "health": m.health,
                    "temperature": m.temperature,
                    "vibration": m.vibration,
                    "operating_hours": m.operating_hours,
                    "last_maintenance": m.last_maintenance.isoformat()
                }
                for m in self.machines
            ]
        }
