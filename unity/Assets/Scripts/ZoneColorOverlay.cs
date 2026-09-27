using UnityEngine;

namespace Shield.Telemetry
{
    /// <summary>
    /// Dynamically updates 3D zone mesh materials based on structural health state.
    /// States: NORMAL (Cyan/Clear), WATCH (Amber), INSPECTION_REQUIRED (Glowing Red).
    /// </summary>
    public class ZoneColorOverlay : MonoBehaviour
    {
        [Header("Structural Zone Mesh Renderers")]
        public Renderer meshFL;
        public Renderer meshFR;
        public Renderer meshMidL;
        public Renderer meshMidR;
        public Renderer meshRL;
        public Renderer meshRR;

        [Header("State Colors")]
        public Color colorNormal = new Color(0f, 0.9f, 1f, 0.4f);
        public Color colorWatch = new Color(1f, 0.65f, 0f, 0.7f);
        public Color colorInspection = new Color(1f, 0.15f, 0.1f, 0.9f);

        public void UpdateZoneState(string sensorOrRegionId, string state)
        {
            Renderer target = GetTargetRenderer(sensorOrRegionId);
            if (target == null) return;

            Color c = colorNormal;
            if (state == "WATCH") c = colorWatch;
            else if (state == "INSPECTION_REQUIRED") c = colorInspection;

            if (target.material.HasProperty("_Color"))
            {
                target.material.color = c;
            }
        }

        private Renderer GetTargetRenderer(string id)
        {
            if (id.Contains("FL") || id == "S01") return meshFL;
            if (id.Contains("FR") || id == "S02") return meshFR;
            if (id.Contains("MID_L") || id == "S03") return meshMidL;
            if (id.Contains("MID_R") || id == "S04") return meshMidR;
            if (id.Contains("RL") || id == "S05") return meshRL;
            if (id.Contains("RR") || id == "S06") return meshRR;
            return null;
        }
    }
}
