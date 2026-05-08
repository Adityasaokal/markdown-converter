import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [title, setTitle] = useState('New Doc');
  const [markdown, setMarkdown] = useState('> This is a **beautiful** blockquote!\n\n### Try typing here!\n- List item 1\n- List item 2');
  const [documents, setDocuments] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/documents/');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDocuments(data);
      } else {
        setDocuments([]); 
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]); 
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        title: title,
        content: markdown
      };
      
      if (currentDocId) {
        payload.id = currentDocId;
      }

      const response = await fetch('http://localhost:8000/documents/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const savedDoc = await response.json();
      setCurrentDocId(savedDoc.id); 
      fetchDocuments(); 
    } catch (error) {
      console.error("Failed to save document:", error);
    }
  };

  // NEW FUNCTION: Handle document deletion
  const handleDelete = async (e, docId) => {
    e.stopPropagation(); // Prevents the sidebar row from acting like it was clicked
    
    // Optional: Add a safety check so you don't delete things by accident
    const isConfirmed = window.confirm("Are you sure you want to delete this document?");
    if (!isConfirmed) return;

    try {
      await fetch(`http://localhost:8000/documents/${docId}`, {
        method: 'DELETE',
      });
      
      // If we just deleted the document we are currently looking at, clear the screen
      if (currentDocId === docId) {
        handleNewDocument();
      }
      
      fetchDocuments(); // Refresh the sidebar list
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleNewDocument = () => {
    setCurrentDocId(null);
    setTitle('New Doc');
    setMarkdown('');
  };

  const loadDocument = (doc) => {
    setCurrentDocId(doc.id);
    setTitle(doc.title);
    setMarkdown(doc.content);
  };

  return (
    <div className="flex h-screen bg-zinc-900 font-sans text-zinc-200 overflow-hidden">
      
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col bg-[#1e1e1e]">
        <h2 className="text-green-500 text-center py-4 font-bold tracking-wide border-b border-zinc-800">
          My Documents
        </h2>
        <div className="p-3 flex-1 overflow-y-auto space-y-2">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => loadDocument(doc)}
              className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${currentDocId === doc.id ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              <span className="truncate">{doc.title}</span>
              {/* UPDATED: Added the onClick event to the X button */}
              <button 
                onClick={(e) => handleDelete(e, doc.id)}
                className="text-zinc-500 hover:text-red-500 font-bold ml-2 transition" 
                title="Delete Document"
              >
                ✕
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-4">No saved documents.</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        
        {/* Top Header */}
        <header className="py-4 bg-[#1e1e1e]">
          <h1 className="text-white text-center text-5xl font-bold tracking-tight">
            Markdown Converter
          </h1>
        </header>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-y border-zinc-800 bg-[#1e1e1e]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded outline-none focus:border-green-500 w-64 transition"
            placeholder="Document Title"
          />
          <button 
            onClick={handleNewDocument}
            className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded transition font-medium"
          >
            New Document
          </button>
          <button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition font-medium shadow-lg shadow-green-900/20"
          >
            Save Document
          </button>
        </div>

        {/* Workspace (Split Screen) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Markdown Editor */}
          <textarea
            className="w-1/2 bg-[#1e1e1e] text-zinc-200 p-6 resize-none outline-none font-mono text-lg border-r border-zinc-800 focus:bg-[#252525] transition-colors"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
          />

          {/* Right Panel: HTML Preview */}
          <div className="w-1/2 bg-[#1e1e1e] p-6 overflow-y-auto">
             <article className="prose prose-invert prose-green max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
             </article>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;