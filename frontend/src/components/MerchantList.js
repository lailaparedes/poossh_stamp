import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MerchantList.css';

function MerchantList() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await axios.get('/api/merchants');
      setMerchants(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load merchants');
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading merchants...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="merchant-list">
      <h2>Select a Merchant</h2>
      <div className="merchants-grid">
        {merchants.map(merchant => (
          <div 
            key={merchant.id} 
            className="merchant-card"
            onClick={() => navigate(`/merchant/${merchant.id}`)}
            style={{ borderLeftColor: merchant.color }}
          >
            {merchant.logo && (
              <div className="merchant-logo">
                <img src={merchant.logo} alt={merchant.name} />
              </div>
            )}
            <div className="merchant-info">
              <h3>{merchant.name}</h3>
              <p className="merchant-category">{merchant.category}</p>
              <p className="merchant-reward">
                {merchant.stamps_required} stamps = {merchant.reward_description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MerchantList;
