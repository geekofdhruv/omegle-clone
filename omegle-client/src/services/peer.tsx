let peer: RTCPeerConnection;

const PeerService = {
  createPeer: () => {
    if (!peer) {
      peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302', // Public STUN server
          },
        ],
      });
    }
    return peer;
  },

  getPeer: () => {
    if (!peer) {
      return PeerService.createPeer();
    }
    return peer;
  },

  getOffer: async () => {
    const pc = PeerService.getPeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  },

  getAnswer: async (offer: RTCSessionDescriptionInit) => {
    const pc = PeerService.getPeer();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  },

  setRemoteDescription: async (answer: RTCSessionDescriptionInit) => {
    const pc = PeerService.getPeer();
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  },

  addIceCandidate: async (candidate: RTCIceCandidateInit) => {
    const pc = PeerService.getPeer();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  },
};

export default PeerService;
