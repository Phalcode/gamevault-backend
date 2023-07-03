import random
from locust import HttpUser, task, constant

class CrackpipeUser(HttpUser):
    wait_time = constant(0)
    network_timeout = 25.0 # Default Timeout in crackpipe-app
    connection_timeout = 25.0 # Default Timeout in crackpipe-app
    
    @task
    def load_random_image(self):
            url = f"https://demo.crackpipe.de/api/v1/images/{random.randint(1, 140)}"
            with self.client.get(url, catch_response=True, auth=("demo", "demodemo")) as res:
                if res.status_code == 404: 
                     res.success()