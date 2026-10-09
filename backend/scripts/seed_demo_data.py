import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.logging_config import logger

async def seed_data():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI} to seed demo data...")
    client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=8000,
        uuidRepresentation="standard"
    )
    db = client[settings.MONGODB_DB_NAME]

    # Clean existing demo data
    logger.info("Purging existing collections...")
    collections_to_clear = [
        "users", "refresh_tokens", "patients", "medical_records",
        "documents", "document_chunks", "appointments", "followups",
        "notifications", "chat_sessions", "chat_messages", "audit_logs"
    ]
    for col in collections_to_clear:
        await db[col].delete_many({})

    logger.info("Seeding synthetic users (Admin, Doctors, Staff, Patients)...")

    # 1. Staff and Admin accounts
    users = [
        {
            "email": "admin@fertilens.ai",
            "password_hash": get_password_hash("Admin@12345"),
            "full_name": "Dr. Victoria Vance (Admin)",
            "role": "admin",
            "patient_id": None,
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "email": "dr.smith@fertilens.ai",
            "password_hash": get_password_hash("Doctor@12345"),
            "full_name": "Dr. Eleanor Smith, MD (REI)",
            "role": "doctor",
            "patient_id": None,
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "email": "dr.chen@fertilens.ai",
            "password_hash": get_password_hash("Doctor@12345"),
            "full_name": "Dr. Marcus Chen, MD (Endocrinology)",
            "role": "doctor",
            "patient_id": None,
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "email": "staff.elena@fertilens.ai",
            "password_hash": get_password_hash("Staff@12345"),
            "full_name": "Elena Rostova (Clinical Coordinator)",
            "role": "staff",
            "patient_id": None,
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    inserted_users = await db.users.insert_many(users)
    doc_smith_id = str(inserted_users.inserted_ids[1])
    doc_chen_id = str(inserted_users.inserted_ids[2])

    # 2. Five Synthetic Patients with comprehensive ART clinical profiles
    patients = [
        {
            "patient_id": "PAT-1001",
            "mrn": "MRN-847291",
            "first_name": "Jane",
            "last_name": "Doe",
            "dob": "1991-04-12",
            "age": 35,
            "gender": "Female",
            "blood_type": "A+",
            "email": "patient.jane@fertilens.ai",
            "phone": "+1 (555) 234-5678",
            "address": "742 Evergreen Terrace, Springfield, OR",
            "emergency_contact": "John Doe (Husband) - +1 (555) 234-5679",
            "amh_level": 1.25,
            "fsh_level": 8.4,
            "antral_follicle_count": 9,
            "primary_diagnosis": "Diminished Ovarian Reserve (DOR) & Mild Endometriosis",
            "treatment_stage": "Ovarian Stimulation (Day 6)",
            "assigned_doctor_id": doc_smith_id,
            "assigned_doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "partner": {
                "name": "John Doe",
                "age": 37,
                "medical_history": "Normal semen analysis (Kruger 4.5% normal forms, count 42M/mL)"
            },
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=90),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "patient_id": "PAT-1002",
            "mrn": "MRN-847292",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "dob": "1994-08-25",
            "age": 32,
            "gender": "Female",
            "blood_type": "O+",
            "email": "patient.sarah@fertilens.ai",
            "phone": "+1 (555) 345-6789",
            "address": "120 Elmwood St, Boston, MA",
            "emergency_contact": "David Jenkins (Spouse) - +1 (555) 345-6780",
            "amh_level": 4.80,
            "fsh_level": 5.1,
            "antral_follicle_count": 22,
            "primary_diagnosis": "Polycystic Ovary Syndrome (PCOS) - High OHSS Risk",
            "treatment_stage": "Monitoring / Antagonist Protocol",
            "assigned_doctor_id": doc_chen_id,
            "assigned_doctor_name": "Dr. Marcus Chen, MD (Endocrinology)",
            "partner": {
                "name": "David Jenkins",
                "age": 34,
                "medical_history": "Normozoospermia, DNA fragmentation index 11% (Normal)"
            },
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=60),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "patient_id": "PAT-1003",
            "mrn": "MRN-847293",
            "first_name": "Emily",
            "last_name": "Ramirez",
            "dob": "1988-11-03",
            "age": 37,
            "gender": "Female",
            "blood_type": "B+",
            "email": "emily.ramirez@example.com",
            "phone": "+1 (555) 456-7890",
            "address": "452 Pacific Coast Hwy, Santa Monica, CA",
            "emergency_contact": "Carlos Ramirez (Brother) - +1 (555) 456-7891",
            "amh_level": 0.65,
            "fsh_level": 11.8,
            "antral_follicle_count": 5,
            "primary_diagnosis": "Age-related Low Reserve & Previous Poor Response",
            "treatment_stage": "Pre-Cycle Priming (DHEA & CoQ10)",
            "assigned_doctor_id": doc_smith_id,
            "assigned_doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "partner": None,
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=45),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "patient_id": "PAT-1004",
            "mrn": "MRN-847294",
            "first_name": "Rachel",
            "last_name": "Goldberg",
            "dob": "1993-02-17",
            "age": 33,
            "gender": "Female",
            "blood_type": "AB-",
            "email": "rachel.goldberg@example.com",
            "phone": "+1 (555) 567-8901",
            "address": "88 Riverside Dr, New York, NY",
            "emergency_contact": "Aaron Goldberg (Spouse) - +1 (555) 567-8902",
            "amh_level": 2.10,
            "fsh_level": 6.8,
            "antral_follicle_count": 14,
            "primary_diagnosis": "Bilateral Tubal Occlusion (Post-Salpingectomy)",
            "treatment_stage": "Embryo Transfer Scheduled",
            "assigned_doctor_id": doc_chen_id,
            "assigned_doctor_name": "Dr. Marcus Chen, MD (Endocrinology)",
            "partner": {
                "name": "Aaron Goldberg",
                "age": 35,
                "medical_history": "Mild asthenozoospermia, ICSI recommended"
            },
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=120),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "patient_id": "PAT-1005",
            "mrn": "MRN-847295",
            "first_name": "Amina",
            "last_name": "Kowalski",
            "dob": "1995-07-09",
            "age": 31,
            "gender": "Female",
            "blood_type": "O-",
            "email": "amina.kowalski@example.com",
            "phone": "+1 (555) 678-9012",
            "address": "334 Michigan Ave, Chicago, IL",
            "emergency_contact": "Tariq Kowalski (Husband) - +1 (555) 678-9013",
            "amh_level": 2.85,
            "fsh_level": 6.2,
            "antral_follicle_count": 16,
            "primary_diagnosis": "Unexplained Infertility (2 Failed IUI Cycles)",
            "treatment_stage": "IVF Cycle 1 - Stimulation Preparation",
            "assigned_doctor_id": doc_smith_id,
            "assigned_doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "partner": {
                "name": "Tariq Kowalski",
                "age": 33,
                "medical_history": "Normal semen volume and morphology"
            },
            "status": "active",
            "created_at": datetime.now(timezone.utc) - timedelta(days=30),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    await db.patients.insert_many(patients)

    # 3. Patient portal login accounts linked to PAT-1001 and PAT-1002
    patient_users = [
        {
            "email": "patient.jane@fertilens.ai",
            "password_hash": get_password_hash("Patient@12345"),
            "full_name": "Jane Doe",
            "role": "patient",
            "patient_id": "PAT-1001",
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc) - timedelta(days=90),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "email": "patient.sarah@fertilens.ai",
            "password_hash": get_password_hash("Patient@12345"),
            "full_name": "Sarah Jenkins",
            "role": "patient",
            "patient_id": "PAT-1002",
            "is_active": True,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": datetime.now(timezone.utc) - timedelta(days=60),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    pat_users_res = await db.users.insert_many(patient_users)
    jane_user_id = str(pat_users_res.inserted_ids[0])
    sarah_user_id = str(pat_users_res.inserted_ids[1])

    # Link user_ids back into patient records
    await db.patients.update_one({"patient_id": "PAT-1001"}, {"$set": {"user_id": jane_user_id}})
    await db.patients.update_one({"patient_id": "PAT-1002"}, {"$set": {"user_id": sarah_user_id}})

    # 4. Medical Records for PAT-1001 (Jane Doe)
    medical_records = [
        {
            "record_id": "REC-5001",
            "patient_id": "PAT-1001",
            "doctor_id": doc_smith_id,
            "doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "record_type": "Consultation Note",
            "title": "Initial IVF Protocol Consultation",
            "date": datetime.now(timezone.utc) - timedelta(days=21),
            "clinical_summary": "Patient is a 35-year-old female presenting with 2.5 years of primary infertility. AMH 1.25 ng/mL, baseline AFC 9. Diagnosed with diminished ovarian reserve. Discussed antagonist stimulation protocol with Gonal-F 300 IU and Menopur 150 IU.",
            "findings": "Uterine cavity regular, endometrial thickness 6.2mm on Cycle Day 3. No intracavitary polyps. Bilateral ovaries visualized.",
            "plan": "Start Microdose Lupron flare or Antagonist protocol. Baseline bloods scheduled on CD2.",
            "vitals": {"blood_pressure": "118/76", "heart_rate": 72, "weight_kg": 61.2, "bmi": 22.4},
            "tags": ["IVF Initial", "Antagonist Protocol", "DOR"],
            "created_at": datetime.now(timezone.utc) - timedelta(days=21),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=21)
        },
        {
            "record_id": "REC-5002",
            "patient_id": "PAT-1001",
            "doctor_id": doc_smith_id,
            "doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "record_type": "Lab Result",
            "title": "Cycle Day 6 Follicular Monitoring Bloodwork",
            "date": datetime.now(timezone.utc) - timedelta(days=2),
            "clinical_summary": "Estradiol (E2) 840 pg/mL, Progesterone 0.42 ng/mL, LH 1.8 mIU/mL. Estradiol rising appropriately in response to gonadotropins.",
            "findings": "Serum hormone levels consistent with multi-follicular recruitment without premature luteinization.",
            "plan": "Continue Gonal-F 300 IU + Menopur 150 IU. Add Ganirelix 250 mcg subcutaneous daily starting this evening.",
            "vitals": {"blood_pressure": "120/78", "heart_rate": 74},
            "tags": ["Lab Results", "Monitoring", "Estradiol"],
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "record_id": "REC-5003",
            "patient_id": "PAT-1001",
            "doctor_id": doc_smith_id,
            "doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "record_type": "Ultrasound",
            "title": "Folliculometry Ultrasound Day 6",
            "date": datetime.now(timezone.utc) - timedelta(days=2),
            "clinical_summary": "Transvaginal ultrasound reveals 8 active follicles. Right ovary: 14mm, 13mm, 12mm, 10mm. Left ovary: 13.5mm, 11mm, 10mm, 9mm.",
            "findings": "Endometrial stripe is trilaminar, measuring 8.4 mm in thickness.",
            "plan": "Repeat ultrasound in 48 hours. Trigger tentatively scheduled for day 10-11.",
            "vitals": None,
            "tags": ["Ultrasound", "Folliculometry", "Endometrium"],
            "created_at": datetime.now(timezone.utc) - timedelta(days=2),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
        }
    ]
    await db.medical_records.insert_many(medical_records)

    # 5. Appointments
    now = datetime.now(timezone.utc)
    appointments = [
        {
            "appointment_id": "APP-3001",
            "patient_id": "PAT-1001",
            "patient_name": "Jane Doe",
            "doctor_id": doc_smith_id,
            "doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "title": "Cycle Day 8 Ultrasound & Bloodwork",
            "appointment_type": "Ultrasound",
            "start_time": now + timedelta(days=1, hours=2),
            "end_time": now + timedelta(days=1, hours=2, minutes=30),
            "status": "scheduled",
            "notes": "Follicle size recheck and Ganirelix response assessment.",
            "location": "Main Fertility Suite 4B",
            "created_at": now,
            "updated_at": now
        },
        {
            "appointment_id": "APP-3002",
            "patient_id": "PAT-1001",
            "patient_name": "Jane Doe",
            "doctor_id": doc_smith_id,
            "doctor_name": "Dr. Eleanor Smith, MD (REI)",
            "title": "Oocyte Retrieval Procedure (Tentative)",
            "appointment_type": "Egg Retrieval",
            "start_time": now + timedelta(days=5, hours=1),
            "end_time": now + timedelta(days=5, hours=2, minutes=30),
            "status": "scheduled",
            "notes": "Fast after midnight preceding procedure. Anesthesia consultation completed.",
            "location": "Surgical OR 2 - Reproductive Wing",
            "created_at": now,
            "updated_at": now
        },
        {
            "appointment_id": "APP-3003",
            "patient_id": "PAT-1002",
            "patient_name": "Sarah Jenkins",
            "doctor_id": doc_chen_id,
            "doctor_name": "Dr. Marcus Chen, MD (Endocrinology)",
            "title": "PCOS Metformin & Stimulation Check",
            "appointment_type": "Consultation",
            "start_time": now + timedelta(days=3, hours=4),
            "end_time": now + timedelta(days=3, hours=4, minutes=45),
            "status": "scheduled",
            "notes": "Review metabolic panel and adjust insulin sensitization.",
            "location": "Endocrinology Suite 2A",
            "created_at": now,
            "updated_at": now
        }
    ]
    await db.appointments.insert_many(appointments)

    # 6. Follow-up items
    followups = [
        {
            "followup_id": "FOL-4001",
            "patient_id": "PAT-1001",
            "patient_name": "Jane Doe",
            "created_by": doc_smith_id,
            "creator_name": "Dr. Eleanor Smith, MD (REI)",
            "title": "Administer Ganirelix 250mcg",
            "description": "Patient must inject first Ganirelix dose subcutaneously at 20:00 tonight to prevent premature LH surge.",
            "due_date": now + timedelta(hours=6),
            "status": "pending",
            "priority": "urgent",
            "category": "Medication",
            "resolution_notes": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now
        },
        {
            "followup_id": "FOL-4002",
            "patient_id": "PAT-1001",
            "patient_name": "Jane Doe",
            "created_by": doc_smith_id,
            "creator_name": "Dr. Eleanor Smith, MD (REI)",
            "title": "Confirm Ovidrel Trigger Kit in Refrigerator",
            "description": "Ensure hCG/Lupron dual trigger prescription is picked up and stored between 2-8°C.",
            "due_date": now + timedelta(days=2),
            "status": "pending",
            "priority": "high",
            "category": "Medication",
            "resolution_notes": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now
        },
        {
            "followup_id": "FOL-4003",
            "patient_id": "PAT-1002",
            "patient_name": "Sarah Jenkins",
            "created_by": doc_chen_id,
            "creator_name": "Dr. Marcus Chen, MD (Endocrinology)",
            "title": "Repeat Fasting Insulin & Glucose",
            "description": "Submit morning fasting blood test prior to starting cycle day 1 medication.",
            "due_date": now + timedelta(days=4),
            "status": "pending",
            "priority": "medium",
            "category": "Lab Work",
            "resolution_notes": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now
        }
    ]
    await db.followups.insert_many(followups)

    # 7. Notifications
    notifications = [
        {
            "notification_id": "NOT-9001",
            "user_id": jane_user_id,
            "title": "New Medication Instruction Added",
            "message": "Dr. Smith has added Ganirelix to your medication calendar. Please review dosage instructions.",
            "notification_type": "alert",
            "read": False,
            "link": "/patient/followups",
            "created_at": now - timedelta(hours=2)
        },
        {
            "notification_id": "NOT-9002",
            "user_id": jane_user_id,
            "title": "Upcoming Ultrasound Scheduled",
            "message": "Your Day 8 Follicular Ultrasound is scheduled for tomorrow at 10:00 AM in Suite 4B.",
            "notification_type": "info",
            "read": True,
            "link": "/patient/appointments",
            "created_at": now - timedelta(days=1)
        }
    ]
    await db.notifications.insert_many(notifications)

    logger.info("Demo data seeding completed successfully!")
    logger.info("================ DEMO CREDENTIALS ================")
    logger.info("Admin:    admin@fertilens.ai       / Admin@12345")
    logger.info("Doctor:   dr.smith@fertilens.ai    / Doctor@12345")
    logger.info("Doctor:   dr.chen@fertilens.ai     / Doctor@12345")
    logger.info("Staff:    staff.elena@fertilens.ai / Staff@12345")
    logger.info("Patient:  patient.jane@fertilens.ai / Patient@12345 (PAT-1001)")
    logger.info("Patient:  patient.sarah@fertilens.ai/ Patient@12345 (PAT-1002)")
    logger.info("==================================================")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
