import React from 'react';

const Loader = ({ fullScreen = false }) => {
    const style = fullScreen 
        ? { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }
        : { display: 'flex', justifyContent: 'center', padding: '40px 0', width: '100%' };

    return (
        <div style={style}>
            <div className="spinner spinner-accent"></div>
        </div>
    );
};

export default Loader;
