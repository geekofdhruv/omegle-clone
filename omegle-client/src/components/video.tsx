import { useEffect, useRef, useState } from 'react';

interface Props {
  roomId: string;
  partnerName: string;
  socket: any;
}

const VideoCall = ({ roomId, partnerName, socket }: Props) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startStream = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // TODO: Add WebRTC peer connection setup here
    };

    startStream();
  }, []);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
      <div>
        <p>You</p>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '300px', height: '200px', background: '#000' }} />
      </div>
      <div>
        <p>{partnerName}</p>
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', height: '200px', background: '#000' }} />
      </div>
    </div>
  );
};

export default VideoCall;
