import { notFound } from 'next/navigation';
import "./page.css";
import { Heart, MessageSquare } from 'lucide-react';

const APILink = process.env.NEXT_PUBLIC_API_URL;
const SONOLUS_SERVER_URL = process.env.NEXT_PUBLIC_SONOLUS_SERVER_URL;

async function fetchLevel(rawId) {
    const cleanId = rawId.replace(/^UnCh-/, '');
    const res = await fetch(`${APILink}/api/charts/${cleanId}/`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const json = await res.json();
    const data = json.data;

    // Fetch comments count
    let commentsCount = 0;
    try {
        const commentsRes = await fetch(`${APILink}/api/charts/${cleanId}/comment/`);
        if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            commentsCount = Array.isArray(commentsData) ? commentsData.length : (commentsData?.data?.length || 0);
        }
    } catch (e) { /* ignore */ }

    return {
        id: data.id,
        sonolusId: rawId,
        title: data.title || 'Untitled Level',
        description: data.description || 'No description provided.',
        author: data.author_full || data.author || 'Unknown',
        handle: data.author_handle || data.username || null,
        rating: data.rating || 0,
        likes: data.likes || data.like_count || 0,
        comments: commentsCount,
        coverUrl: data.cover || data.jacket || null
    };
}

export default async function EmbedPage({ params }) {
    const { id } = await params;
    let level;

    try {
        level = await fetchLevel(id);
    } catch (e) {
        notFound();
    }

    const authorDisplay = level.handle ? `${level.author}#${level.handle}` : level.author;
    const baseUrl = SONOLUS_SERVER_URL || '';

    return (
        <a href={`${baseUrl}/levels/${level.sonolusId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="embed-container">
                <div className="embed-content">
                    {level.coverUrl && (
                        <img src={level.coverUrl} alt={level.title} className="embed-thumbnail" />
                    )}
                    <div className="embed-info">
                        <h1 className="embed-title">{level.title}</h1>
                        <p className="embed-description">{level.description}</p>
                    </div>
                </div>

                <div className="embed-footer">
                    <span className="embed-stat"><Heart size={14} /> {level.likes}</span>
                    <span className="embed-divider">|</span>
                    <span className="embed-stat"><MessageSquare size={14} /> {level.comments}</span>
                    <span className="embed-divider">|</span>
                    <span className="embed-author">{authorDisplay}</span>
                </div>
            </div>
        </a>
    );
}
