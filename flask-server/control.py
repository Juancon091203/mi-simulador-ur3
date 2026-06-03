import rtde_control
import rtde_receive
import xmlrpc.client

class Robot_Control(object):
    @classmethod
    def init(cls):
        # Initialize class variables
        cls.reconnecting = False
        cls.__rtde_c = None
        cls.__rtde_r = None
        cls.__xmlrpc_c = None
        cls.__const_mov = 0.05  # Constant for linear movement
        cls.__const_rot = 0.15  # Constant for rotational movement

    @classmethod
    def connect(cls, ip_adress):
        # Si la IP apunta al local o al planificador, conectar vía XML-RPC
        if ip_adress.lower() in ['localhost', '127.0.0.1', 'planner', '192.168.65.254']:
            # En Docker Desktop para Windows, el host es accesible a través de 192.168.65.254
            target_ip = '192.168.65.254' if ip_adress.lower() in ['localhost', '127.0.0.1', 'planner'] else ip_adress
            try:
                print(f"[INFO] Connecting to Trajectory Planner XML-RPC server on http://{target_ip}:8085...", flush=True)
                cls.__xmlrpc_c = xmlrpc.client.ServerProxy(f"http://{target_ip}:8085", allow_none=True)
                # Test connection
                q = cls.__xmlrpc_c.get_actual_q()
                print(f"[INFO] Connected to Trajectory Planner XML-RPC server. Initial q: {q}", flush=True)
                return True
            except Exception as e:
                print(f"[ERROR] XML-RPC Connection to Trajectory Planner failed: {e}", flush=True)
                cls.__xmlrpc_c = None
                return False

        try:
            # Attempt to connect to the robot directly via RTDE
            # cls.__rtde_c = rtde_control.RTDEControlInterface(ip_adress)
            cls.__rtde_r = rtde_receive.RTDEReceiveInterface(ip_adress)

            if cls.__rtde_r.isConnected():
                print("[INFO] Robot is connected via RTDE (READ-ONLY MODE)")
                cls.__xmlrpc_c = None
                return True
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}", flush=True)
            return False

    @classmethod
    def disconnect(cls):
        try:
            # Attempt to disconnect from the robot
            if cls.__xmlrpc_c:
                cls.__xmlrpc_c = None
            if cls.__rtde_r: 
                cls.__rtde_r.disconnect()
            print("[INFO] Robot is disconnected")
        except AttributeError:
            print("[WARNING] Robot is not connected")

    @classmethod
    def reconnect(cls):
        print("[INFO] Reconnect ignored in current configuration")
        pass

    @classmethod
    def read_robot_pos(cls):
        # Read the current robot position
        if cls.__xmlrpc_c is not None:
            try:
                q = cls.__xmlrpc_c.get_actual_q()
                if q is not None and isinstance(q, list) and len(q) == 6:
                    return q
            except Exception as e:
                pass
            return [0.0] * 6

        if cls.__rtde_r is None:
            return [0.0] * 6
        elif not cls.__rtde_r.isConnected():
            return [0.0] * 6
        else:
            return cls.__rtde_r.getActualQ()

    @classmethod
    def sub_data(cls, data):
        # Handle the received command and perform corresponding robot movements
        # const_mov = cls.__const_mov
        # const_rot = cls.__const_rot
        # rtde_c = cls.__rtde_c

        # if not rtde_c.isConnected():
        #     return 0  # Indicate not connected

        # if not rtde_c.isProgramRunning():
        #     return 1  # Indicate program not running

        # # Initialize speed vector for robot movements
        # speed_vector = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        # t_start = rtde_c.initPeriod()

        # # Match the received data to corresponding movements
        # match data:
        #     case "x+":
        #         speed_vector[0] = const_mov
        #     case "x-":
        #         speed_vector[0] = -const_mov
        #     case "y+":
        #         speed_vector[1] = const_mov
        #     case "y-":
        #         speed_vector[1] = -const_mov
        #     case "z+":
        #         speed_vector[2] = -const_mov
        #     case "z-":
        #         speed_vector[2] = const_mov
        #     case "rx+":
        #         speed_vector[3] = const_rot
        #     case "rx-":
        #         speed_vector[3] = -const_rot
        #     case "ry+":
        #         speed_vector[4] = const_rot
        #     case "ry-":
        #         speed_vector[4] = -const_rot
        #     case "rz+":
        #         speed_vector[5] = const_rot
        #     case "rz-":
        #         speed_vector[5] = -const_rot
        #     case "stop":
        #         speed_vector = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        #     case _:
        #         speed_vector = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

        # # Start jogging with the calculated speed vector
        # rtde_c.jogStart(speed_vector, rtde_c.FEATURE_TOOL)
        # rtde_c.waitPeriod(t_start)


        # ... (Lógica de control comentada para modo lectura) ...
        print(f"[LOG] Command '{data}' ignored (Read-Only Mode active)")
        return 2  # Indicate successful command processing
