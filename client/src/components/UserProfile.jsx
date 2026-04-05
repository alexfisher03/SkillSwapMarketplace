import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function UserProfile({ currentUser }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');

  // Check if the currently logged-in user is viewing their own profile
  const isOwnProfile = currentUser && currentUser.user_id === Number(userId);

  // Suggested skills for the combobox dropdown
  const suggestedSkills = [
    "JavaScript", "Python", "React", "Calculus", 
    "Resume Review", "Graphic Design", "Data Structures",
    "Public Speaking", "Git"
  ];

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, [userId]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const currentSkills = profile.self_proclaimed_skills || [];
    
    // Prevent duplicates
    if (currentSkills.includes(newSkill.trim())) {
      setNewSkill('');
      return; 
    }

    const updatedSkills = [...currentSkills, newSkill.trim()];

    try {
      const response = await fetch(`/api/users/${userId}/skills`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.token}`
         },
        body: JSON.stringify({ skills: updatedSkills })
      });

      if (response.ok) {
        setProfile({ ...profile, self_proclaimed_skills: updatedSkills });
        setNewSkill('');
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.error || 'Unknown server error'}`);
        console.error("Backend rejected the request:", errorData);
      }
    } catch (error) {
      alert("Network error: Could not reach the server.");
      console.error("Error saving skill:", error);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = profile.self_proclaimed_skills.filter(s => s !== skillToRemove);
    
    try {
      const response = await fetch(`/api/users/${userId}/skills`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser?.token}`
         },
        body: JSON.stringify({ skills: updatedSkills })
      });

      if (response.ok) {
        setProfile({ ...profile, self_proclaimed_skills: updatedSkills });
      } else {
        const errorData = await response.json();
        alert(`Failed to remove: ${errorData.error || 'Unknown server error'}`);
      }
    } catch (error) {
      alert("Network error: Could not reach the server.");
      console.error("Error removing skill:", error);
    }
  };

  if (loading) return <div className="container mt-5">Loading profile...</div>;
  if (!profile) return <div className="container mt-5">User not found.</div>;

  return (
    <div className="container mt-5">
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h2 className="card-title">{profile.display_name}</h2>
          <p className="text-muted">{profile.email}</p>

          <hr />

          <h4 className="mb-3">Skills</h4>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {profile.self_proclaimed_skills?.length > 0 ? (
              profile.self_proclaimed_skills.map((skill, index) => (
                <span key={index} className="badge bg-primary fs-6 d-flex align-items-center gap-2">
                  {skill}
                  {/* Only show the 'X' button if it's the user's own profile */}
                  {isOwnProfile && (
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      style={{ fontSize: '0.5em' }}
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label="Remove"
                    ></button>
                  )}
                </span>
              ))
            ) : (
              <p className="text-muted">No skills added yet.</p>
            )}
          </div>

          {/* Only show the 'Add Skill' form if it's the user's own profile */}
          {isOwnProfile && (
            <form onSubmit={handleAddSkill} className="d-flex gap-2" style={{ maxWidth: '400px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type or select a skill..." 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                list="skill-suggestions" 
              />
              <datalist id="skill-suggestions">
                {suggestedSkills.map(skill => (
                  <option key={skill} value={skill} />
                ))}
              </datalist>
              <button type="submit" className="btn btn-outline-primary">Add</button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}