import sys
import time
import math
import random
import asyncio
import argparse
import serial
import serial.tools.list_ports
import websockets
import json

connected_clients = set()
active_serial = None

# Simulation State for live virtual hardware testbench
sim_state = {
    "base_weight_kg": 0.0,
    "applied_force_kg": 24.5,
    "manual_temp": -999.0,
    "buzzer": False,
    "motor_pwm": 0,
    "led_green": True,
    "led_yellow": False,
    "led_red": False,
    "tare_offset": 842000,
    "thresh_weight_warn": 30.0,
    "thresh_weight_crit": 50.0,
    "thresh_temp_warn": 38.0,
    "thresh_temp_crit": 45.0,
    "thresh_roll_warp": 25.0,
}

def find_available_ports():
    try:
        ports = serial.tools.list_ports.comports()
        return [p.device for p in ports]
    except Exception:
        return []

def handle_simulation_command(cmd: str):
    """Processes actuator and threshold commands received from Web Twin in simulation mode."""
    cmd = cmd.strip()
    if not cmd:
        return

    if cmd.startswith("CMD:BUZZER:1") or cmd.startswith("CMD:BUZZER:ON"):
        sim_state["buzzer"] = True
        print(f"[\033[92mSIM ACK\033[0m] Piezo Buzzer: \033[92mON\033[0m")
    elif cmd.startswith("CMD:BUZZER:0") or cmd.startswith("CMD:BUZZER:OFF"):
        sim_state["buzzer"] = False
        print(f"[\033[92mSIM ACK\033[0m] Piezo Buzzer: \033[90mOFF\033[0m")
    elif cmd.startswith("CMD:MOTOR:"):
        try:
            pwm = int(cmd.split(":")[2])
            sim_state["motor_pwm"] = max(0, min(255, pwm))
            print(f"[\033[92mSIM ACK\033[0m] Vibration Motor PWM set to: \033[96m{sim_state['motor_pwm']}/255\033[0m")
        except Exception:
            pass
    elif cmd.startswith("CMD:LED_GREEN:"):
        sim_state["led_green"] = cmd.endswith("1") or cmd.endswith("ON")
    elif cmd.startswith("CMD:LED_YELLOW:"):
        sim_state["led_yellow"] = cmd.endswith("1") or cmd.endswith("ON")
    elif cmd.startswith("CMD:LED_RED:"):
        sim_state["led_red"] = cmd.endswith("1") or cmd.endswith("ON")
    elif cmd.startswith("CMD:SET_BASE_WEIGHT:"):
        try:
            val = float(cmd.split(":")[2])
            sim_state["base_weight_kg"] = max(0.0, val)
            print(f"[\033[92mSIM ACK\033[0m] Base Weight calibrated to: \033[96m{sim_state['base_weight_kg']:.2f} kg\033[0m")
        except Exception:
            pass
    elif cmd.startswith("CMD:SET_TEMP:"):
        try:
            val = float(cmd.split(":")[2])
            sim_state["manual_temp"] = val
            print(f"[\033[92mSIM ACK\033[0m] Manual Temperature set to: \033[96m{val:.1f} °C\033[0m")
        except Exception:
            pass
    elif cmd.startswith("CMD:ALARM_TEST:1"):
        sim_state["buzzer"] = True
        sim_state["motor_pwm"] = 255
        sim_state["led_red"] = True
        sim_state["led_green"] = False
        print(f"[\033[91mSIM ACK\033[0m] Full Alarm Emergency Siren TEST: \033[91mACTIVE\033[0m")
    elif cmd.startswith("CMD:ALARM_TEST:0"):
        sim_state["buzzer"] = False
        sim_state["motor_pwm"] = 0
        sim_state["led_red"] = False
        sim_state["led_green"] = True
        print(f"[\033[92mSIM ACK\033[0m] Alarm Emergency Siren TEST: \033[92mSTANDBY\033[0m")
    elif cmd.startswith("CMD:RESET_PARAMS"):
        sim_state["base_weight_kg"] = 0.0
        sim_state["manual_temp"] = -999.0
        sim_state["buzzer"] = False
        sim_state["motor_pwm"] = 0
        print(f"[\033[92mSIM ACK\033[0m] All hardware parameters reset to factory defaults.")

async def ws_handler(websocket):
    global active_serial
    connected_clients.add(websocket)
    client_ip = getattr(websocket, 'remote_address', 'Client')
    print(f"[\033[92m+\033[0m] Browser 3D Simulation connected: {client_ip}")
    try:
        async for message in websocket:
            cmd = str(message).strip()
            print(f"[\033[95mWEB COMMAND -> HARDWARE\033[0m] \033[1m{cmd}\033[0m")
            if active_serial and active_serial.is_open:
                try:
                    active_serial.write(f"{cmd}\n".encode('utf-8'))
                    active_serial.flush()
                except Exception as ex:
                    print(f"[\033[91m!\033[0m] Error writing command to serial: {ex}")
            else:
                handle_simulation_command(cmd)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"[\033[91m-\033[0m] Browser 3D Simulation disconnected: {client_ip}")

async def broadcast_telemetry(line: str):
    if not connected_clients:
        return
    dead = set()
    for ws in list(connected_clients):
        try:
            await ws.send(line)
        except Exception:
            dead.add(ws)
    for ws in dead:
        connected_clients.discard(ws)

def open_serial_connection(port_name, baud_rate):
    print(f"[*] Opening serial port: \033[96m{port_name}\033[0m at \033[96m{baud_rate}\033[0m baud...")
    s = serial.Serial(port_name, baud_rate, timeout=1, dsrdtr=True, rtscts=True)
    s.setDTR(True)
    s.setRTS(True)
    time.sleep(1)
    print(f"[\033[92m✓\033[0m] Connected to hardware on {port_name}! Bi-directional stream active...")
    return s

async def live_simulation_generator():
    """Generates continuous high-fidelity 25Hz live telemetry stream."""
    tick = 0
    print("\n[\033[92m✓\033[0m] \033[1mSHIELD Live Telemetry Stream Engine ACTIVE!\033[0m Streaming at 25 Hz...\n")

    while True:
        tick += 1
        t_sec = tick * 0.04  # 40ms loop = 25Hz

        # Dynamic physics simulation
        base_w = sim_state["base_weight_kg"]
        noise_w = (random.random() - 0.5) * 0.15
        wave_w = 1.2 * math.sin(t_sec * 0.8)
        total_weight = max(0.0, base_w + sim_state["applied_force_kg"] + wave_w + noise_w)
        total_force = total_weight * 9.81

        dyn_mpa = (total_weight * 0.0092) + 0.04 * math.sin(t_sec * 1.5)
        peak_mpa = dyn_mpa * 1.25

        # IMU dynamics
        roll_jitter = 0.8 * math.sin(t_sec * 1.1) + (random.random() - 0.5) * 0.2
        pitch_jitter = 0.5 * math.cos(t_sec * 0.9) + (random.random() - 0.5) * 0.15
        g_force = 1.0 + 0.08 * math.sin(t_sec * 2.2) + (random.random() - 0.5) * 0.03
        shock = g_force * 9.81
        gyro_z = 0.4 * math.sin(t_sec * 1.8)

        # Temperature
        if sim_state["manual_temp"] >= 0.0:
            effective_temp = sim_state["manual_temp"]
        else:
            effective_temp = 24.5 + 0.8 * math.sin(t_sec * 0.2) + (random.random() - 0.5) * 0.1
        imu_temp = effective_temp + 6.8 + (random.random() - 0.5) * 0.05

        # Health status check
        status_flag = ""
        if total_weight >= sim_state["thresh_weight_crit"]:
            status_flag = " --> CRITICAL OVERLOAD!"
        elif effective_temp >= sim_state["thresh_temp_crit"]:
            status_flag = " --> CRITICAL OVERHEAT!"
        elif abs(roll_jitter) > sim_state["thresh_roll_warp"]:
            status_flag = " --> FRAME TORSION TWIST!"
        elif total_weight >= sim_state["thresh_weight_warn"]:
            status_flag = " --> LOAD WARNING"
        elif effective_temp >= sim_state["thresh_temp_warn"]:
            status_flag = " --> ELEVATED TEMP WARNING"

        # Format line identical to Arduino firmware
        line = (
            f"DATA: [LOAD] W: {total_weight:.2f} kg | F: {total_force:.2f} N | "
            f"[STRESS] Dyn: {dyn_mpa:.3f} MPa | Peak: {peak_mpa:.3f} MPa | "
            f"[G-FORCE] {g_force:.2f} G (Shock: {shock:.1f} m/s2) | "
            f"[WARP] ΔR: {roll_jitter:.1f}° | ΔP: {pitch_jitter:.1f}° | "
            f"[GYRO] {gyro_z:.1f} °/s | "
            f"[TEMP] Chassis: {effective_temp:.1f} C (IMU: {imu_temp:.1f} C){status_flag}"
        )

        # Broadcast line directly to connected WebSocket clients (Web Dashboard / 3D Simulation)
        await broadcast_telemetry(line)

        # Print periodic preview in terminal
        if tick % 25 == 0:
            if "CRITICAL" in status_flag:
                print(f"\033[91m[LIVE TELEMETRY ALERT]\033[0m {line}")
            elif "WARNING" in status_flag:
                print(f"\033[93m[LIVE TELEMETRY WARN]\033[0m  {line}")
            else:
                print(f"\033[94m[LIVE TELEMETRY DATA]\033[0m  {line}")

        await asyncio.sleep(0.04)

async def serial_reader_loop(port_name, baud_rate):
    global active_serial
    loop = asyncio.get_running_loop()
    
    while True:
        try:
            active_serial = await loop.run_in_executor(None, open_serial_connection, port_name, baud_rate)
            while True:
                line_bytes = await loop.run_in_executor(None, active_serial.readline)
                if not line_bytes:
                    await asyncio.sleep(0.01)
                    continue
                try:
                    line = line_bytes.decode('utf-8', errors='ignore').strip()
                except Exception:
                    continue

                if line:
                    if "CRITICAL" in line or "TORSION" in line or "TWIST" in line:
                        print(f"\033[91m[HARDWARE ALERT]\033[0m {line}")
                    elif "WARN" in line:
                        print(f"\033[93m[HARDWARE WARN]\033[0m {line}")
                    else:
                        print(f"\033[94m[HARDWARE DATA]\033[0m {line}")

                    await broadcast_telemetry(line)
        except serial.SerialException as se:
            print(f"[\033[91m!\033[0m] Serial port {port_name} unavailable: {se}.")
            print("[\033[93m!\033[0m] Switching to Real-Time Simulated Live Telemetry Stream...")
            await live_simulation_generator()
        except Exception as e:
            print(f"[\033[91m!\033[0m] Unexpected error: {e}. Switching to Live Telemetry Stream...")
            await live_simulation_generator()

async def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="SHIELD Hardware Bi-Directional Bridge Server")
    parser.add_argument("--port", default="COM5", help="Serial port (default: COM5)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default: 115200)")
    parser.add_argument("--ws-port", type=int, default=8765, help="WebSocket port (default: 8765)")
    parser.add_argument("--simulate", action="store_true", help="Force high-fidelity simulated hardware live stream")
    args = parser.parse_args()

    available_ports = find_available_ports()
    print("=" * 68)
    print("  \033[1;36mSHIELD Real-Time Hardware & Live Telemetry Bridge Server\033[0m")
    print("=" * 68)
    print(f"  * WebSocket Server   : \033[92mws://localhost:{args.ws_port}\033[0m")
    print(f"  * Target Serial Port : {args.port}")
    print(f"  * Available COM Ports: {available_ports if available_ports else 'None detected'}")
    print("=" * 68)

    # Start WebSocket Server for browser 3D twin & live charts
    ws_server = await websockets.serve(ws_handler, "0.0.0.0", args.ws_port)
    print(f"[+] WebSocket server active on ws://localhost:{args.ws_port}")
    print(f"[*] Dashboard live stream ready at: \033[1mhttp://localhost:5173\033[0m\n")

    if args.simulate or (args.port not in available_ports):
        if args.simulate:
            print("[*] Starting in forced Live Simulation Stream Mode...")
        else:
            print(f"[!] COM port '{args.port}' not plugged in. Auto-starting Live Telemetry Stream...")
        await live_simulation_generator()
    else:
        await serial_reader_loop(args.port, args.baud)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[*] Bridge server stopped by user.")
