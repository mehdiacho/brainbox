import React, { useState } from 'react';
import { Modal, Button, Form, Tabs, Tab } from 'react-bootstrap';

interface IdeaFormProps {
  show: boolean;
  onHide: () => void;
  onSave: (idea: any) => void;
}

const IdeaForm: React.FC<IdeaFormProps> = ({ show, onHide, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [imageUrl, setImageUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newIdea = {
      id: Date.now().toString(),
      title,
      type: activeTab,
      createdAt: new Date(),
      content: activeTab === 'text' ? content : 
               activeTab === 'image' ? imageUrl : 
               activeTab === 'voice' ? audioBlob : content
    };
    
    onSave(newIdea);
    resetForm();
    onHide();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setAudioBlob(null);
    setActiveTab('text');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // In a real app, you would start recording audio here
    console.log('Started recording');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In a real app, you would stop recording and get the audio blob
    console.log('Stopped recording');
    
    // Simulating an audio blob for demo purposes
    setAudioBlob(new Blob([]));
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create New Idea</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Give your idea a title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="text" title="Text">
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={5} 
                  placeholder="Describe your idea..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </Form.Group>
            </Tab>
            
            <Tab eventKey="image" title="Image">
              <Form.Group className="mb-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter image URL or upload"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-center my-3">
                <Button variant="outline-secondary">Upload Image</Button>
              </div>
              {imageUrl && (
                <div className="image-preview mt-3">
                  <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                </div>
              )}
            </Tab>
            
            <Tab eventKey="voice" title="Voice">
              <div className="d-flex flex-column align-items-center my-4">
                <div className="voice-recorder mb-3">
                  {!isRecording ? (
                    <Button 
                      variant="outline-danger" 
                      size="lg" 
                      className="rounded-circle p-3"
                      onClick={handleStartRecording}
                    >
                      🎤
                    </Button>
                  ) : (
                    <Button 
                      variant="danger" 
                      size="lg" 
                      className="rounded-circle p-3"
                      onClick={handleStopRecording}
                    >
                      ⏹️
                    </Button>
                  )}
                </div>
                <p>{isRecording ? 'Recording...' : audioBlob ? 'Recording saved' : 'Click to start recording'}</p>
              </div>
            </Tab>
            
            <Tab eventKey="video" title="Video">
              <p className="text-center my-4">Video recording functionality coming soon!</p>
            </Tab>
          </Tabs>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={!title || (activeTab === 'text' && !content) || 
                   (activeTab === 'image' && !imageUrl) || 
                   (activeTab === 'voice' && !audioBlob)}
        >
          Save Idea
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default IdeaForm;