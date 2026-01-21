"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, Globe, EyeOff, Lock, Unlock, Link as LinkIcon, XIcon } from "lucide-react";
import "./ChartModal.css";
import { useLanguage } from "../../contexts/LanguageContext";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";
import LiquidSelect from "../liquid-select/LiquidSelect";
import { formatBytes } from "../../utils/byteUtils";

const ModalInput = ({ id, label, value, onChange, maxLength, placeholder, required = false, type = "text", inputMode, min = undefined, max = undefined, ...props }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char-count ${value?.length >= maxLength ? 'limit-reached' : ''}`}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      min={min}
      max={max}
      {...props}
    />
  </div>
);

const ModalTextarea = ({ id, label, value, onChange, maxLength, placeholder }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char-count ${value?.length >= maxLength ? 'limit-reached' : ''}`}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows="4"
      maxLength={maxLength}
      placeholder={placeholder}
    />
  </div>
);

const FilePreview = ({ file, type }) => {
  const [url, setUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!url) return null;

  if (type === 'image') {
    return (
      <div className="preview-container">
        <img src={url} alt="Preview" className="preview-image" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="audio-preview-container" style={{ width: '100%', marginTop: '8px' }}>
        <AudioControls
          bgmUrl={url}
          onPlay={handlePlay}
          onStop={handleStop}
          isPlaying={isPlaying}
          isActive={isPlaying}
          audioRef={(ref) => { audioRef.current = ref; }}
        />
        {isPlaying && (
          <AudioVisualizer
            audioRef={audioRef.current}
            isPlaying={isPlaying}
          />
        )}
      </div>
    );
  }
  return null;
};

// ... (validateLevelValue stays same)

export default function ChartModal({
  isOpen,
  mode,
  form,
  onClose,
  onSubmit,
  onUpdate,
  loading = false,
  editData = null,
  limits = null
}) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const visibilityOptions = [
    { value: "public", label: "Public", icon: Globe },
    { value: "unlisted", label: "Unlisted", icon: LinkIcon },
    { value: "private", label: "Private", icon: Lock }
  ];

  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});

  const handlePlay = useCallback((audioId) => {
    if (currentlyPlaying && currentlyPlaying !== audioId) {
      const currentAudio = audioRefs.current[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }
    setCurrentlyPlaying(audioId);
  }, [currentlyPlaying]);

  const handleStop = useCallback((audioId) => {
    setCurrentlyPlaying(null);
  }, []);

  const handleAudioRef = useCallback((audioId, ref) => {
    audioRefs.current[audioId] = ref;
  }, []);

  const checkFileLimit = useCallback((limit, updateHandler) => (e) => {
    if (e.target.files && e.target.files[0]) {
      if (limit && e.target.files[0].size > limit) {
        alert(`File is too large! Maximum size is ${formatBytes(limit)}.`);
        e.target.value = "";
        return;
      }
    }
    updateHandler(e);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="edit-container">
        <div className="modal-header">
          <strong>
            {mode === "edit"
              ? (editData && editData.title ? `Edit: ${editData.title}` : "Edit Chart")
              : "Upload New Chart"
            }
          </strong>
          <button type="button" onClick={onClose} aria-label="Close" className="close-btn">✕</button>
        </div>
        <div className="modal-content">
          {/* Edit Form */}
          <div className="meta-form" hidden={mode !== "edit"}>
            <form onSubmit={onSubmit}>
              <ModalInput id="title_edit" label={t('modal.songTitle', 'Song Title')} value={form.title} onChange={onUpdate("title")} maxLength={limits?.text?.title || 50} placeholder="e.g. Freedom Dive" />
              <ModalInput id="artists_edit" label={t('modal.artists', 'Artist(s)')} value={form.artists} onChange={onUpdate("artists")} maxLength={limits?.text?.artist || 50} placeholder="e.g. xi" />
              <ModalInput id="author_edit" label={t('modal.charter', 'Charter Name')} value={form.author} onChange={onUpdate("author")} maxLength={limits?.text?.author || 50} placeholder="Your Name" />

              <ModalInput
                id="rating_edit"
                label={t('modal.level', 'Level')}
                value={form.rating}
                onChange={(e) => {
                  const value = validateLevelValue(e.target.value)
                  onUpdate("rating")(value)
                }}
                placeholder="e.g. 25"
                type="number"
                inputMode="numeric"
                min={-999}
                max={999}
              />

              <ModalTextarea id="description_edit" label={t('modal.description', 'Description (Optional)')} value={form.description} onChange={onUpdate("description")} maxLength={limits?.text?.description || 1000} placeholder="Tell us about your chart..." />

              <ModalInput id="tags_edit" label={t('modal.tags', 'Tags (comma separated)')} value={form.tags} onChange={onUpdate("tags")} placeholder="e.g. Anime, Rhythm, Fast" />

              <div className="form-group">
                <label htmlFor="visibility_edit">{t('modal.visibility', 'Visibility')}</label>
                <LiquidSelect
                  value={form.visibility || "public"}
                  onChange={(e) => onUpdate("visibility")(e)}
                  options={visibilityOptions}
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="jacket_edit">{t('modal.coverImage', 'Cover Image')} (.png/.jpg, max {limits?.files?.jacket ? formatBytes(limits.files.jacket) : '5MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="jacket_edit"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={checkFileLimit(limits?.files?.jacket || 5 * 1024 * 1024, (e) => {
                      onUpdate("jacket")(e);
                      onUpdate("removeJacket")(false);
                    })}
                  />
                  {!form.jacket && editData && editData.jacketUrl && !form.removeJacket && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeJacket")(true)}
                    >
                      <XIcon className="size-4" />
                      Remove Existing
                    </div>
                  )}
                  {form.removeJacket && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> Existing cover will be removed
                      <button type="button" onClick={() => onUpdate("removeJacket")(false)} className="text-blue-500 underline text-xs">Undo</button>
                    </div>
                  )}
                </div>
                {form.jacket && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.jacket.name })}</span>
                      <button type="button" onClick={() => onUpdate("jacket")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.jacket} type="image" />
                  </div>
                )}
                {editData && editData.jacketUrl && !form.jacket && !form.removeJacket && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { name: editData.jacketUrl.split('/').pop() })}</span>
                    </div>
                    <img src={editData.jacketUrl} alt="Current jacket" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="bgm_edit">{t('modal.audio', 'Audio')} (max {limits?.files?.audio ? formatBytes(limits.files.audio) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="bgm_edit"
                    type="file"
                    accept="audio/mp3, audio/mpeg"
                    onChange={checkFileLimit(limits?.files?.audio || 20 * 1024 * 1024, (e) => {
                      onUpdate("bgm")(e);
                      onUpdate("removeAudio")(false);
                    })}
                  />
                  {!form.bgm && editData && editData.bgmUrl && !form.removeAudio && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeAudio")(true)}
                    >
                      <XIcon className="size-4" />
                      Remove Existing
                    </div>
                  )}
                  {form.removeAudio && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> Existing audio will be removed
                      <button type="button" onClick={() => onUpdate("removeAudio")(false)} className="text-blue-500 underline text-xs">Undo</button>
                    </div>
                  )}
                </div>
                {form.bgm && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.bgm.name })}</span>
                      <button type="button" onClick={() => onUpdate("bgm")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.bgm} type="audio" />
                  </div>
                )}
                {editData && editData.bgmUrl && !form.bgm && !form.removeAudio && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { name: editData.bgmUrl.split('/').pop() })}</span>
                    </div>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.bgmUrl}
                        onPlay={() => handlePlay('edit-bgm')}
                        onStop={() => handleStop('edit-bgm')}
                        isPlaying={currentlyPlaying === 'edit-bgm'}
                        isActive={currentlyPlaying === 'edit-bgm'}
                        audioRef={(ref) => handleAudioRef('edit-bgm', ref)}
                      />
                      {currentlyPlaying === 'edit-bgm' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-bgm']}
                          isPlaying={currentlyPlaying === 'edit-bgm'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_edit">{t('modal.chartFile', 'Chart File')} (max {limits?.files?.chart ? formatBytes(limits.files.chart) : '10MB'})</label>
                <div className="flex gap-1 flex-col">
                  {(!editData?.chartUrl || form.removeChart) && (
                    <input
                      id="chart_edit"
                      type="file"
                      onChange={checkFileLimit(limits?.files?.chart || 10 * 1024 * 1024, (e) => {
                        onUpdate("chart")(e);
                        onUpdate("removeChart")(false);
                      })}
                    />
                  )}
                  {!form.chart && editData && editData.chartUrl && !form.removeChart && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeChart")(true)}
                    >
                      <XIcon className="size-4" />
                      Remove Existing / Replace
                    </div>
                  )}
                  {form.removeChart && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> Existing chart will be removed
                      <button type="button" onClick={() => onUpdate("removeChart")(false)} className="text-blue-500 underline text-xs">Undo</button>
                    </div>
                  )}
                </div>
                {form.chart && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.chart.name })}</span>
                      <button type="button" onClick={() => onUpdate("chart")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                )}
                {editData && editData.chartUrl && !form.chart && !form.removeChart && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { name: "Chart File" })}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_edit">{t('modal.previewAudio', 'Preview Audio (Optional)')} (max {limits?.files?.preview ? formatBytes(limits.files.preview) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="preview_edit"
                    type="file"
                    accept="audio/mp3, audio/mpeg"
                    onChange={checkFileLimit(limits?.files?.preview || 20 * 1024 * 1024, (e) => {
                      onUpdate("preview")(e)
                      onUpdate("removePreview")(false)
                    })}
                  />
                  {!form.preview && editData && editData.previewUrl && !form.removePreview && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => {
                        onUpdate("removePreview")(true)
                      }}
                    >
                      <XIcon className="size-4" />
                      Remove Existing
                    </div>
                  )}
                  {form.removePreview && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> Existing preview will be removed
                      <button type="button" onClick={() => onUpdate("removePreview")(false)} className="text-blue-500 underline text-xs">Undo</button>
                    </div>
                  )}
                </div>
                {form.preview && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.preview.name })}</span>
                      <button type="button" onClick={() => onUpdate("preview")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.preview} type="audio" />
                  </div>
                )}
                {editData && editData.previewUrl && !form.preview && !form.removePreview && (
                  <div className="file-preview">
                    <span>{t('modal.current', { name: editData.previewUrl.split('/').pop() })}</span>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.previewUrl}
                        onPlay={() => handlePlay('edit-preview')}
                        onStop={() => handleStop('edit-preview')}
                        isPlaying={currentlyPlaying === 'edit-preview'}
                        isActive={currentlyPlaying === 'edit-preview'}
                        audioRef={(ref) => handleAudioRef('edit-preview', ref)}
                      />
                      {currentlyPlaying === 'edit-preview' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-preview']}
                          isPlaying={currentlyPlaying === 'edit-preview'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_edit">{t('modal.backgroundImage', 'Background Image (Optional)')} (max {limits?.files?.background ? formatBytes(limits.files.background) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="background_edit"
                    type="file"
                    accept="image/png"
                    onChange={checkFileLimit(limits?.files?.background || 5 * 1024 * 1024, (e) => {
                      onUpdate("background")(e)
                      onUpdate("removeBackground")(false)
                    })}
                  />
                  {!form.background && editData && editData.backgroundUrl && !form.removeBackground && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => {
                        onUpdate("removeBackground")(true)
                      }}
                    >
                      <XIcon className="size-4" />
                      Remove Existing
                    </div>
                  )}
                  {form.removeBackground && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> Existing background will be removed
                      <button type="button" onClick={() => onUpdate("removeBackground")(false)} className="text-blue-500 underline text-xs">Undo</button>
                    </div>
                  )}
                </div>
                {form.background && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.background.name })}</span>
                      <button type="button" onClick={() => onUpdate("background")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.background} type="image" />
                  </div>
                )}
                {editData && editData.backgroundUrl && !form.background && !form.removeBackground && (
                  <div className="file-preview">
                    <img src={editData.backgroundUrl} alt="Current Background" />
                  </div>
                )}
              </div>

              <button className="edit-save-btn" type="submit" disabled={loading}>
                {loading ? t('modal.saving', 'Saving...') : t('modal.saveChanges', 'Save Changes')}
              </button>
            </form>
          </div>

          {/* Upload Form */}
          <div className="upload-form" hidden={mode !== "upload"}>
            {/* ... Reminders omitted (unchanged) ... */}
            <div className="modal-reminders">
              <h4>{t('modal.remindersTitle', '⚠️ Read before uploading:')}</h4>
              <ul>
                <li>{t('modal.reminder1')}</li>
                <li>{t('modal.reminder2', { size: limits?.files?.audio ? formatBytes(limits.files.audio) : '20MB' })}</li>
                <li>{t('modal.reminder3', { size: limits?.files?.chart ? formatBytes(limits.files.chart) : '10MB' })}</li>
                <li>{t('modal.reminder4', { size: limits?.files?.jacket ? formatBytes(limits.files.jacket) : '5MB' })}</li>
              </ul>
            </div>
            <form onSubmit={onSubmit}>
              <ModalInput id="title_up" label={`${t('modal.songTitle', 'Song Title')} *`} value={form.title} onChange={onUpdate("title")} maxLength={limits?.text?.title || 50} placeholder="e.g. Bad Apple!!" required />
              <ModalInput id="artists_up" label={`${t('modal.artists', 'Artist(s)')} *`} value={form.artists} onChange={onUpdate("artists")} maxLength={limits?.text?.artist || 50} placeholder="e.g. Alstroemeria Records" required />
              <ModalInput id="author_up" label={`${t('modal.charter', 'Charter Name')} *`} value={form.author} onChange={onUpdate("author")} maxLength={limits?.text?.author || 50} placeholder="Your username" required />

              <ModalInput
                id="rating_up"
                label={`${t('modal.level', 'Level')} *`}
                value={form.rating}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > 3) val = val.slice(0, 3);
                  onUpdate("rating")(val)
                }}
                placeholder="e.g. 28"
                required type="number"
                inputMode="numeric"
                min={-999}
                max={999}
              />

              <ModalTextarea id="description_up" label={t('modal.description', 'Description (Optional)')} value={form.description} onChange={onUpdate("description")} maxLength={limits?.text?.description || 1000} placeholder="Any comments or details..." />

              <ModalInput id="tags_up" label={t('modal.tags', 'Tags')} value={form.tags} onChange={onUpdate("tags")} placeholder="e.g. Touhou, Vocaloid" />

              <div className="form-group">
                <label htmlFor="visibility_up">{t('modal.visibility', 'Visibility')} *</label>
                <select
                  id="visibility_up"
                  value={form.visibility || "public"}
                  onChange={onUpdate("visibility")}
                >
                  <option value="public">{t('dashboard.public')}</option>
                  <option value="unlisted">{t('dashboard.unlisted')}</option>
                  <option value="private">{t('dashboard.private')}</option>
                </select>
              </div>

              <div className="form-group file-section">
                <label htmlFor="jacket_up">{t('modal.coverImage', 'Cover Image')} (.png/.jpg, max {limits?.files?.jacket ? formatBytes(limits.files.jacket) : '5MB'}) *</label>
                <input
                  id="jacket_up"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={checkFileLimit(limits?.files?.jacket || 5 * 1024 * 1024, onUpdate("jacket"))}
                  required
                />
                {form.jacket && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.jacket.name })}</span>
                      <button type="button" onClick={() => onUpdate("jacket")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.jacket} type="image" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="bgm_up">{t('modal.audio', 'Audio')} (.mp3, max {limits?.files?.audio ? formatBytes(limits.files.audio) : '20MB'}) *</label>
                <input
                  id="bgm_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(limits?.files?.audio || 20 * 1024 * 1024, onUpdate("bgm"))}
                  required
                />
                {form.bgm && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.bgm.name })}</span>
                      <button type="button" onClick={() => onUpdate("bgm")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.bgm} type="audio" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_up">{t('modal.chartFile', 'Chart File')} (max {limits?.files?.chart ? formatBytes(limits.files.chart) : '10MB'}) *</label>
                <input
                  id="chart_up"
                  type="file"
                  onChange={checkFileLimit(limits?.files?.chart || 10 * 1024 * 1024, onUpdate("chart"))}
                  required
                />
                {form.chart && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.chart.name })}</span>
                      <button type="button" onClick={() => onUpdate("chart")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_up">{t('modal.previewAudio', 'Preview Audio (Optional)')} (max {limits?.files?.preview ? formatBytes(limits.files.preview) : '50 MB'})</label>
                <input
                  id="preview_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(limits?.files?.preview || 20 * 1024 * 1024, onUpdate("preview"))}
                />
                {form.preview && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.preview.name })}</span>
                      <button type="button" onClick={() => onUpdate("preview")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.preview} type="audio" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_up">{t('modal.backgroundImage', 'Background Image (Optional)')} (max {limits?.files?.background ? formatBytes(limits.files.background) : '50 MB'})</label>
                <input
                  id="background_up"
                  type="file"
                  accept="image/png"
                  onChange={checkFileLimit(limits?.files?.background || 5 * 1024 * 1024, onUpdate("background"))}
                />
                {form.background && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { name: form.background.name })}</span>
                      <button type="button" onClick={() => onUpdate("background")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.background} type="image" />
                  </div>
                )}
              </div>

              <button
                className="upload-save-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('modal.uploading', 'Uploading...')}
                  </>
                ) : (
                  t('modal.upload', 'Upload Chart')
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
