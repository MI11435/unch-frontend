"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import './error.css';

export default function Error({ error, reset }) {
    const { t } = useLanguage();

    return (
        <div className="error-container">
            <div className="error-content">
                <div className="error-gif-container">
                    <img src="/error.gif" alt="Error" className="error-gif" />
                </div>
                <h1 className="error-title">{t('error.somethingWentWrong', 'Something went wrong!')}</h1>
                <p className="error-message">{error.message || t('error.errorMessage', 'An unexpected error occurred.')}</p>
                {error.digest && (
                    <div className="error-digest" style={{
                        margin: '10px 0',
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: '#ff6b6b'
                    }}>
                        <p>Error Code: {error.digest}</p>
                    </div>
                )}
                <div className="error-actions">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`Error: ${error.message}\nDigest: ${error.digest}\nStack: ${error.stack}`);
                            alert('Error copied to clipboard');
                        }}
                        className="error-button copy"
                        style={{ background: '#475569', marginRight: '10px' }}
                    >
                        Copy Error
                    </button>
                    <button onClick={() => reset()} className="error-button retry">
                        {t('error.tryAgain')}
                    </button>
                    <a href="/" className="error-button home">
                        {t('error.goHome')}
                    </a>
                </div>
            </div>
        </div>
    );
}
