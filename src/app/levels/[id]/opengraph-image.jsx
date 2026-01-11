import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Level Detail';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = params;
    const cleanId = id.replace(/^UnCh-/, '');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    let logoData = null;
    let mikuData = null;

    try {
        const logoUrl = new URL('../../../../public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png', import.meta.url);
        const mikuUrl = new URL('../../../../public/miku-sitting.png', import.meta.url);

        const [logoRes, mikuRes] = await Promise.all([
            fetch(logoUrl),
            fetch(mikuUrl)
        ]);

        if (logoRes.ok) logoData = await logoRes.arrayBuffer();
        if (mikuRes.ok) mikuData = await mikuRes.arrayBuffer();
    } catch (e) {
        console.error(e);
    }

    let levelData = null;
    let assetBaseUrl = null;
    let jacketData = null;

    try {
        const res = await fetch(`${apiUrl}/api/charts/${cleanId}/`);
        if (res.ok) {
            const json = await res.json();
            levelData = json.data;
            assetBaseUrl = json.asset_base_url;

            if (assetBaseUrl && levelData?.jacket_file_hash && levelData?.author && levelData?.id) {
                const jacketUrl = `${assetBaseUrl}/${levelData.author}/${levelData.id}/${levelData.jacket_file_hash}`;
                try {
                    const imgRes = await fetch(jacketUrl);
                    if (imgRes.ok) {
                        const buffer = await imgRes.arrayBuffer();
                        const bytes = new Uint8Array(buffer);

                        let mimeType = 'image/png';
                        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) mimeType = 'image/jpeg';

                        let binary = '';
                        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                        jacketData = `data:${mimeType};base64,${btoa(binary)}`;
                    }
                } catch (e) { }
            }
        }
    } catch (e) { }

    if (!levelData) {
        return new ImageResponse(
            (
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 20,
                    fontFamily: 'sans-serif',
                }}>
                    {logoData && <img src={logoData} width={60} height={60} style={{ position: 'absolute', top: 40, left: 60 }} />}
                    <div style={{ fontSize: 80, display: 'flex' }}>❌</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: 'white', display: 'flex' }}>Chart Not Found</div>
                    <div style={{ fontSize: 24, color: '#94a3b8', display: 'flex' }}>This chart may have been deleted or doesn't exist</div>
                </div>
            ),
            { ...size }
        );
    }

    const isStaffPick = levelData.staff_pick === 1 || levelData.staff_pick === true || levelData.staff_picked || levelData.staffPicked || levelData.is_staff_pick;

    return new ImageResponse(
        (
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                padding: 60,
                gap: 40,
                alignItems: 'center',
                position: 'relative',
                fontFamily: 'sans-serif',
            }}>
                {logoData && <img src={logoData} width={50} height={50} style={{ position: 'absolute', top: 40, left: 60 }} />}

                {isStaffPick && (
                    <div style={{
                        position: 'absolute',
                        top: 40,
                        right: 60,
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#fbbf24',
                        background: 'rgba(251, 191, 36, 0.15)',
                        padding: '8px 18px',
                        borderRadius: 50,
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        ⭐ Staff Pick
                    </div>
                )}

                {mikuData && (
                    <img
                        src={mikuData}
                        width={200}
                        height={200}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            opacity: 0.6,
                            objectFit: 'contain'
                        }}
                    />
                )}

                {jacketData ? (
                    <img src={jacketData} width={260} height={260} style={{ borderRadius: 20, objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: 260,
                        height: 260,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        border: '3px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 80,
                    }}>
                        🎵
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', zIndex: 10 }}>
                    <div style={{
                        fontSize: 28,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '10px 24px',
                        borderRadius: 50,
                        border: '2px solid rgba(56, 189, 248, 0.3)',
                        fontWeight: 800,
                        marginBottom: 20,
                        display: 'flex',
                        alignSelf: 'flex-start',
                    }}>
                        Lv. {levelData.rating || '?'}
                    </div>

                    <div style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 16, display: 'flex' }}>
                        {(levelData.title || 'Untitled').slice(0, 25)}
                    </div>

                    <div style={{ fontSize: 28, color: '#cbd5e1', marginBottom: 8, display: 'flex' }}>
                        {(levelData.artists || 'Unknown Artist').slice(0, 35)}
                    </div>

                    <div style={{ fontSize: 22, color: '#64748b', display: 'flex' }}>
                        Charted by {(levelData.author_full || levelData.author || 'Unknown').slice(0, 20)}
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', gap: 24, color: '#94a3b8', fontSize: 20 }}>
                        <span style={{ display: 'flex' }}>❤️ {levelData.likes || levelData.like_count || 0}</span>
                        <span style={{ display: 'flex' }}>💬 {levelData.comment_count || 0}</span>
                    </div>
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: 30,
                    left: 60,
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#38bdf8',
                    display: 'flex',
                    letterSpacing: '-0.02em',
                }}>
                    UntitledCharts
                </div>
            </div>
        ),
        { ...size }
    );
}
