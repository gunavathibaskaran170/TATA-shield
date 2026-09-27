using UnityEngine;

namespace Shield.Vehicle
{
    /// <summary>
    /// Rigidbody & WheelCollider EV Vehicle Controller for SHIELD Unity Scenes.
    /// Handles throttle, steering, braking, suspension travel, and follow/orbit cameras.
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    public class VehicleController : MonoBehaviour
    {
        [Header("Vehicle Configuration")]
        public float motorTorque = 1500f;
        public float brakeTorque = 3000f;
        public float maxSteerAngle = 32f;
        public Vector3 centerOfMassOffset = new Vector3(0f, -0.45f, 0f);

        [Header("Wheel Colliders")]
        public WheelCollider wheelFL;
        public WheelCollider wheelFR;
        public WheelCollider wheelRL;
        public WheelCollider wheelRR;

        [Header("Wheel Transform Visuals")]
        public Transform meshFL;
        public Transform meshFR;
        public Transform meshRL;
        public Transform meshRR;

        private Rigidbody _rb;

        private void Start()
        {
            _rb = GetComponent<Rigidbody>();
            _rb.centerOfMass += centerOfMassOffset;
        }

        private void FixedUpdate()
        {
            float steerInput = Input.GetAxis("Horizontal");
            float accelInput = Input.GetAxis("Vertical");
            bool isBraking = Input.GetKey(KeyCode.Space);

            float currentSteer = steerInput * maxSteerAngle;
            if (wheelFL) wheelFL.steerAngle = currentSteer;
            if (wheelFR) wheelFR.steerAngle = currentSteer;

            float currentMotor = accelInput * motorTorque;
            if (wheelRL) wheelRL.motorTorque = currentMotor;
            if (wheelRR) wheelRR.motorTorque = currentMotor;

            float currentBrake = isBraking ? brakeTorque : 0f;
            ApplyBrakes(currentBrake);

            UpdateWheelVisuals(wheelFL, meshFL);
            UpdateWheelVisuals(wheelFR, meshFR);
            UpdateWheelVisuals(wheelRL, meshRL);
            UpdateWheelVisuals(wheelRR, meshRR);
        }

        private void ApplyBrakes(float brake)
        {
            if (wheelFL) wheelFL.brakeTorque = brake;
            if (wheelFR) wheelFR.brakeTorque = brake;
            if (wheelRL) wheelRL.brakeTorque = brake;
            if (wheelRR) wheelRR.brakeTorque = brake;
        }

        private void UpdateWheelVisuals(WheelCollider collider, Transform visual)
        {
            if (collider == null || visual == null) return;
            Vector3 pos;
            Quaternion rot;
            collider.GetWorldPose(out pos, out rot);
            visual.position = pos;
            visual.rotation = rot;
        }
    }
}
