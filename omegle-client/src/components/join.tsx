import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import PeerService from '../services/peer';

const ChatRoom = () => {
  const socket = useSocket();

  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [partner, setPartner] = useState('');
  const [joined, setJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const handleJoin = () => {
    if (name.trim()) {
      socket?.emit('join-queue', name);
      setJoined(true);
    }
  };

  // Get local media stream
  useEffect(() => {
    if (!joined) return;
  
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setLocalStream(stream);
      console.log('local',stream);
      
      setTimeout(() => {
        if (localVideoRef.current) {
          
          localVideoRef.current.srcObject = stream;
          
        }
      }, 100);
      stream.getTracks().forEach((track) => {
        PeerService.getPeer().addTrack(track, stream);
      });
    });
  }, [joined,roomId]);

  useEffect(() => {
    if (!socket) return;
  
    const pc = PeerService.getPeer();
  
    // Always listen for ICE candidates on both sides
    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.emit('send-ice-candidate', {
          candidate: event.candidate,
          roomId,
        });
      }
    };
  
    // When matched, create or wait for offer
    socket.on('matched', async ({ roomId, partnerName, shouldCreateOffer }) => {
      setRoomId(roomId);
      setPartner(partnerName);
  
      if (shouldCreateOffer) {
        const offer = await PeerService.getOffer();
        socket.emit('send-offer', { offer, roomId });
      }
    });
  
    socket.on('receive-offer', async ({ offer }) => {
      const answer = await PeerService.getAnswer(offer);
      socket.emit('send-answer', { answer, roomId });
    });
  
    socket.on('receive-answer', async ({ answer }) => {
      await PeerService.setRemoteDescription(answer);
    });
  
    // Receive ICE candidate
    socket.on('receive-ice-candidate', ({ candidate }) => {
      PeerService.addIceCandidate(candidate);
    });
  
    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        
      }
    };
  
    // Cleanup on unmount
    return () => {
      socket.off('matched');
      socket.off('receive-offer');
      socket.off('receive-answer');
      socket.off('receive-ice-candidate');
    };
  }, [socket, roomId]);

  const handleSkip = () => {
    PeerService.getPeer().close();
    socket?.emit('skip-room', { roomId, name });
    setRoomId('');
    setPartner('');
  };

  return (
    <div className="p-6 text-white">
      {!joined ? (
        <>
          <h2 className="mb-2">Enter your name to join:</h2>
          <input
            className="px-3 py-1 rounded text-black mr-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
          />
          <button onClick={handleJoin} className="bg-blue-600 px-4 py-2 rounded">
            Join
          </button>
        </>
      ) : !roomId ? (
        <p className="text-xl mt-4 text-black">⏳ Waiting for match...</p>
      ) : (
        <>
          <h3 className="text-lg mb-2 text-black">✅ Connected with {partner}</h3>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="mb-1">You</p>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-72 h-48 bg-black rounded" />
            </div>
            <div>
              <p className="mb-1">{partner}</p>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-72 h-48 bg-black rounded" />
            </div>
          </div>
          <button
  onClick={handleSkip}
  className="bg-yellow-500 mt-4 px-4 py-2 rounded"
>
  Skip
</button>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
