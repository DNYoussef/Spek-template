# Test file with deliberate connascence violations for CI/CD testing

class TestClass:
    """Test class with intentional code quality issues"""
    
    def __init__(self):
        # Connascence of Name - shared global state
        global shared_data
        shared_data = {}
        self.data = shared_data  # CoN violation
        
    def process_data(self, input_type, value):
        # Connascence of Position - parameter order dependency
        if input_type == "string":
            return self.string_processor(value, True, "default")  # CoP violation
        elif input_type == "number":  
            return self.number_processor(value, True, "default")  # CoP violation
        else:
            return None
            
    def string_processor(self, text, flag, default_val):
        # Connascence of Meaning - magic numbers
        if len(text) > 50:  # Magic number - CoM violation
            return text[:50]
        return text
        
    def number_processor(self, num, flag, default_val):
        # Connascence of Algorithm - duplicate logic  
        if num > 50:  # Same magic number - CoA violation
            return 50
        return num
        
    def get_status(self):
        # Connascence of Type - type dependency
        return shared_data.get("status", 0)  # Assumes int type - CoT violation

# NASA POT10 violations
def overly_complex_function():
    """Function exceeding 60 lines (NASA Rule 4 violation)"""
    result = 0
    for i in range(100):
        for j in range(100):
            for k in range(10):  # Nested loops > 3 levels (NASA Rule 8)
                if i > 50:
                    if j > 30:
                        if k > 5:
                            if i + j + k > 100:
                                if result < 1000:
                                    if i % 2 == 0:  # Too many nested ifs (NASA Rule 9)
                                        result += 1
                                    else:
                                        result += 2
                                else:
                                    result = 0
                            else:
                                result -= 1
                        else:
                            result += 10
                    else:
                        result -= 5
                else:
                    result += i
    return result

# God object pattern
class GodObject:
    """Intentionally large class violating SRP"""
    
    def __init__(self):
        self.data = {}
        self.config = {}
        self.cache = {}
        self.logs = []
        self.metrics = {}
        self.connections = []
        self.handlers = {}
        
    def process_data(self): pass
    def validate_input(self): pass  
    def transform_data(self): pass
    def save_to_db(self): pass
    def send_email(self): pass
    def log_activity(self): pass
    def calculate_metrics(self): pass
    def generate_report(self): pass
    def handle_errors(self): pass
    def manage_cache(self): pass
    def configure_system(self): pass
    def authenticate_user(self): pass
    def authorize_action(self): pass
    def encrypt_data(self): pass
    def decrypt_data(self): pass
    def compress_files(self): pass
    def backup_data(self): pass
    def restore_data(self): pass
    def monitor_performance(self): pass
    def schedule_tasks(self): pass
    def manage_connections(self): pass
    def handle_requests(self): pass
    def format_output(self): pass
    def parse_input(self): pass
    def validate_config(self): pass