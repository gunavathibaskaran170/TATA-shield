# SHIELD — Master Verification Test Plan

## Overview
This document defines the 20 mandatory automated and manual verification tests required by the SHIELD specification.

## Test Matrix
| ID | Test Name | Target Component | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| T01 | Schema Validation | `schemas/telemetry_v1.0.json` | Valid packets pass; malformed packets raise ValidationError |
| T02 | Invalid Packet Rejection | `backend/app/main.py` | Rejected with 422 or 400 status code |
| T03 | Source Isolation | `backend/app/main.py` | Virtual test input ignored when active source is Hardware |
| T04 | Sensor-to-Zone Mapping | `backend/app/analytics.py` | S01->FL, S02->FR, S03->MID_L, S04->MID_R, S05->RL, S06->RR |
| T05 | Known-Load Calibration | `gateway/serial_gateway.py` | Mass converted to force via F = m*g |
| T06 | Residual Analytics Engine | `backend/app/analytics.py` | Residual = Measured - Expected calculated accurately |
| T07 | Noise Floor Filtering | `backend/app/analytics.py` | Residuals below noise floor zeroed |
| T08 | Hysteresis & Persistence | `backend/app/analytics.py` | Windowed persistence score computed |
| T09 | State Decision Logic | `backend/app/analytics.py` | Normal, Watch, Inspection Required assigned correctly |
| T10 | Unmonitored Region Handling | Dashboard UI | Displays "—" or "Unmonitored", never false green |
| T11 | Disconnection & Stale Detection | WebSocket Client | Stale status assigned after heartbeat timeout |
| T12 | Tare Baseline Command | Firmware / Backend | Tare resets offset and logs audit event |
| T13 | Baseline A Validation | Stage 1 UI | Complete checklist required before Baseline A capture |
| T14 | Baseline B Validation | Stage 2 UI | Matched pre/post load response compared |
| T15 | Complete Car Mode | 3D Viewer | Closed finished metallic silver SUV exterior |
| T16 | Transparent Body Mode | 3D Viewer | Pearl-white glass shell exposing unibody frame |
| T17 | Chassis Only Mode | 3D Viewer | Bare structural frame, crossmembers, battery, subframes |
| T18 | Exploded Assembly Mode | 3D Viewer | Exploded CAD view with distance slider |
| T19 | Skeletal Mode Integrity | 3D Viewer | Original BIW and component hierarchy preserved |
| T20 | Hardware Live FLUX Page | Dashboard UI | Interactive SVG netlist, packet inspector, connection log |
