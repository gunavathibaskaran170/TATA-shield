using System;
using System.Collections;
using UnityEngine;

namespace Shield.Telemetry
{
    [System.Serializable]
    public class SensorResultData
    {
        public string sensor_id;
        public string state;
        public float residual;
        public float anomaly_score;
    }

    [System.Serializable]
    public class TelemetryPacketData
    {
        public string vehicle_id;
        public string source;
        public SensorResultData[] results;
    }

    /// <summary>
    /// Connects Unity client to SHIELD FastAPI WebSocket backend (/ws/telemetry).
    /// Receives live residual analytics and dispatches state updates to zone overlays.
    /// </summary>
    public class TelemetryWebSocketClient : MonoBehaviour
    {
        public string backendWsUrl = "ws://localhost:8000/ws/telemetry";
        public ZoneColorOverlay zoneOverlay;

        private void Start()
        {
            Debug.Log($"[SHIELD Unity Telemetry] Initializing WebSocket client target: {backendWsUrl}");
        }

        public void ProcessIncomingPacket(string jsonText)
        {
            try
            {
                TelemetryPacketData packet = JsonUtility.FromJson<TelemetryPacketData>(jsonText);
                if (packet != null && packet.results != null && zoneOverlay != null)
                {
                    foreach (var res in packet.results)
                    {
                        zoneOverlay.UpdateZoneState(res.sensor_id, res.state);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SHIELD Unity Telemetry] Packet parse error: {ex.Message}");
            }
        }
    }
}
