"use client";
import { memo } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Heart, MessageSquare, Calendar, Globe, Lock, Link as LinkIcon, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatRelativeTime } from "../../utils/dateUtils";
import LiquidSelect from "../liquid-select/LiquidSelect";

const DashboardChartItem = memo(({ post, sonolusUser, openEdit, handleDelete, updateVisibility, isActive, onToggleMenu }) => {
    const { t } = useLanguage();
    const router = useRouter();

    const isPublic = post.status === "PUBLIC";
    const displayDate = isPublic ? (post.publishedAt || post.createdAt) : post.createdAt;
    const dateLabel = isPublic ? t('dashboard.published', 'Published') : t('dashboard.uploaded', 'Uploaded');

    return (
        <div className="chart-card-redesigned">
            {/* Background Layer */}
            <div
                className="card-bg"
                style={{ backgroundImage: `url(${post.coverUrl || '/placeholder.png'})` }}
            />

            {/* Left: Thumbnail */}
            <div
                className="card-thumb cursor-pointer"
                onClick={() => router.push(`/levels/UnCh-${post.id}`)}
            >
                {post.coverUrl ? (
                    <img src={post.coverUrl} alt={post.title} loading="lazy" />
                ) : (
                    <div className="placeholder-thumb">
                        <span className="no-img-text">No Image</span>
                    </div>
                )}
            </div>

            {/* Middle: Info */}
            <div className="card-info">
                <div className="info-header">
                    <div className="flex items-center justify-start gap-2">
                        <h3 title={post.title}>{post.title}</h3>
                        <span title="Rating" className="rating-badge text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Lv. {post.rating}</span>
                    </div>
                    <div className="action-menu-wrapper">
                        <button
                            className="icon-btn-ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMenu(post.id);
                            }}
                        >
                            <MoreVertical size={16} />
                        </button>
                        <div
                            className={`action-dropdown ${isActive ? 'active' : ''}`}
                            style={{ display: isActive ? 'flex' : 'none' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => router.push(`/levels/UnCh-${post.id}`)}>
                                <Eye size={14} style={{ marginRight: '8px' }} /> {t('dashboard.view', 'View')}
                            </button>
                            {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
                                <>
                                    <button onClick={() => openEdit(post)}>
                                        <Pencil size={14} style={{ marginRight: '8px' }} /> {t('dashboard.edit', 'Edit')}
                                    </button>
                                    <button className="text-red" onClick={() => handleDelete(post)}>
                                        <Trash2 size={14} style={{ marginRight: '8px' }} /> {t('dashboard.delete', 'Delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="author-name">
                    {t('hero.chartedBy', 'Charted by')} {post.author}
                </div>

                <div className="card-stats-row" style={{ marginTop: 'auto' }}>
                    <span><Heart size={12} fill="currentColor" /> {post.likeCount}</span>
                    <span><MessageSquare size={12} /> {post.commentsCount}</span>
                    <span title={`${dateLabel}: ${displayDate}`}><Calendar size={12} /> {formatRelativeTime(displayDate, t)}</span>
                </div>
            </div>

            {sonolusUser && sonolusUser.sonolus_id === post.authorId && (
                <div style={{ marginLeft: 'auto', paddingLeft: '12px' }}>
                    <LiquidSelect
                        value={post.status}
                        type='ghost'
                        className={`status-text ${post.status?.toLowerCase()}`}
                        options={['UNLISTED', 'PRIVATE', 'PUBLIC'].map(x => ({ value: x, label: x }))}
                        onChange={(e) => updateVisibility(post, e.target.value)}
                    />
                </div>
            )}
        </div>
    );
});

DashboardChartItem.displayName = "DashboardChartItem";

export default DashboardChartItem;
