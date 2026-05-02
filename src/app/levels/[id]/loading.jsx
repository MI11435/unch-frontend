export default function Loading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 300px)' }}>
            <div className="loading-spinner" />
        </div>
    );
}
