# Health Guide (AWS Practicum)

Health Guide is an AWS-based Generative AI IDP + transcription system that supports a patient’s end-to-end workflow from symptom intake to post-visit actions. This repo contains a synthetic dataset generator and a local pipeline skeleton that mirrors the planned AWS architecture.

**Scope & Capabilities**
1. Symptom intake with non-diagnostic triage and suggested specialty
2. Insurance-aware provider shortlisting
3. Audio + document summarization into plain language outputs
4. Structured extraction of symptoms, meds, tests, and follow-ups
5. Signature/consent detection with “Before You Sign” highlights
6. Billing reconciliation across multiple billers
7. Personalized post-visit action plan based on patient preferences

**Safety Boundary**
The system summarizes and personalizes instructions already present in source documents and audio. It does not create new medical or legal advice.

**Architecture (Planned AWS Services)**
1. S3 for raw/processed storage
2. Textract for OCR/layout extraction
3. Transcribe Medical for audio transcription
4. Bedrock for summarization, simplification, extraction, and action plans
5. Bedrock Embeddings + OpenSearch for RAG over glossary and explainers
6. Step Functions for orchestration
7. Lambda for validation, routing, and confidence logic
8. DynamoDB for episode metadata, provider directory, and preferences
9. A2I for human review on low-confidence outputs
10. CloudWatch/IAM/KMS for monitoring and security

**Quickstart (Local Skeleton)**
```bash
# 1) Generate synthetic dataset
python3 "Synthetic Dataset Build/generate_dataset.py"

# 2) Build manifest (optional)
python3 "Synthetic Dataset Build/build_manifest.py"

# 3) Run local pipeline skeleton
python3 scripts/run_local.py
```

**UI (Local Console)**
```bash
# Run a local static server from the repo root
python3 -m http.server 8000
```

Open `http://localhost:8000/app/` to explore the full patient console:
1. Dashboard overview + timeline + episode deep dive
2. Symptom checker picklist
3. Legal document intake and parsing (frontend simulated)
4. Medical data upload for transcription (frontend simulated)
5. Patient profile summary and next steps

**Outputs**
Local outputs are written to `outputs/episodes/<episode_id>.json` and include:
- Triage summary and suggested specialties
- Provider shortlist
- Plain-language summary
- Structured extraction
- Consent review with “Before You Sign” section
- Billing reconciliation grouped by bill type
- Personalized action plan

**Repository Layout**
- `Synthetic Dataset Build/` Synthetic data generator and sample UI
- `src/` Pipeline skeleton and components
- `scripts/` Local run script

**Roadmap**
1. Replace rule-based stubs with AWS service integrations
2. Add document classifier and episode linker
3. Expand provider/insurance matching logic
4. Add confidence scoring and human review flows
5. Implement RAG-based explainers for billing and consent
