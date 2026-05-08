import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
from models import Document

# Load environment variables from the .env file
load_dotenv()

app = FastAPI(title="Markdown Converter API")

# Configure CORS so any live frontend can communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # UPDATED: Allows any domain to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Supabase credentials not found in .env file!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def health_check():
    return {"status": "API is running and connected to Supabase!"}

@app.post("/documents/")
def save_document(doc: Document):
    # doc.model_dump() converts our Pydantic model into a standard Python dictionary
    data = doc.model_dump() 
    
    try:
        # Upsert: Update if ID exists, Insert if it is a new ID
        response = supabase.table("documents").upsert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/")
def get_all_documents():
    try:
        # Fetch all documents, ordered by newest first
        response = supabase.table("documents").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    try:
        # Tell Supabase to delete the row where the 'id' column matches our doc_id
        response = supabase.table("documents").delete().eq("id", doc_id).execute()
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))