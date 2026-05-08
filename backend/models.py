from pydantic import BaseModel
import uuid

class Document(BaseModel):
    # We use default_factory so it generates a fresh UUID every time you create a new doc
    id: str = str(uuid.uuid4())
    title: str = "New Doc"
    content: str = ""