import {Box, Button, FormGroup, Grid, TextField, Typography} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import qs from "qs";
import {k_video_chat_route} from "../../App";
import {k_is_doctor, k_name_search_param, k_room_code_search_param} from "../HomePage";
import socketIOClient from "socket.io-client";
import {v4 as uuidV4} from 'uuid';
import Peer from "peerjs";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import faker from 'faker';

// get url of socket server
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;
console.log("API ENDPOINT", API_ENDPOINT);

// keep track of possible status for clients
const k_connected_status = "connected";
const k_disconnected_status = "disconnected";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// video chatting page
const VideoChatPage = () => {
    // reference to socket handler
    const [socketHandler, setSocketHandler] = useState(undefined);

    // keep track of video streams from clients
    const [remoteStreams, setRemoteStreams] = useState({});

    // keep track of what the user's name and the room code
    const [userName, setUserName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [userId, setUserId] = useState(`${uuidV4()}`);

    const [heartRate, setHeartRate] = useState(70);
    const [temperature, setTemperature] = useState(98.6);
    const [oximetry, setOximetry] = useState(95);

    const [isDoctor, setIsDoctor] = useState(false);

    const [thermalImageData, setThermalImageData] = useState('data:image/jpeg;base64,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');

    const [showThermalImage, setShowThermalImage] = useState(false);

    const myVideoRef = useRef(undefined);

    // keep track of video clients
    const [clients, setClients] = useState({
        // 'id1': {
        //     socketId: 'id1',
        //     roomId: 'testval',
        //     name: 'user a',
        //     status: k_connected_status
        // },
    });

    // keep track of chat messages
    const [chatMessages, setChatMessages] = useState([
        // {
        //     guid: 'guid1',
        //     socketId: 'id1',
        //     message: 'message 1'
        // },
    ]);

    const [labels, setLabels] = useState([]);
    const [data1, setData] = useState(labels.map(() => faker.datatype.float({ min: -0.2, max: 1.0 })));

    // get the search string, ex: "?name=deepak&room-code=abc123"
    const {search} = useLocation();

    // function to navigate between pages
    const navigate = useNavigate();

    // every time the search string changes (should happen only once), run this function
    useEffect(() => {
        // navigate to home if search params are empty
        if (!search || search.length <= 0) {
            navigate(k_video_chat_route);
            return;
        }

        // remove the question mark present in the beginning of search params
        const searchWithoutQuestionMark = search.substring(1);
        const parsedSearch = qs.parse(searchWithoutQuestionMark);

        // get the name of person and room code from search params
        const nameFromSearch = parsedSearch[k_name_search_param];
        const roomCodeFromSearch = parsedSearch[k_room_code_search_param];
        const isDoctorFromSearch = parsedSearch[k_is_doctor];

        // navigate to home if search params are not valid
        if (!nameFromSearch || nameFromSearch.length <= 0 || !roomCodeFromSearch || roomCodeFromSearch.length <= 0) {
            navigate(k_video_chat_route);
            return;
        }

        if (isDoctorFromSearch && isDoctorFromSearch === 'true') {
            setIsDoctor(true);
        } else {
            setIsDoctor(false);
        }

        // otherwise if everything is valid and we were able to get the search params, store these as variables
        setUserName(nameFromSearch);
        setRoomCode(roomCodeFromSearch);
    }, [search]);

    const addVideoStream = (remoteStream, peerId) => {
        // console.log('adding video stream for peer', remoteStream.id);
        const remoteStreamsCopy = remoteStreams;
        remoteStreamsCopy[peerId] = remoteStream;
        setRemoteStreams(Object.assign({}, remoteStreamsCopy));
    }

    useEffect(() => {
        if(userId.trim().length > 0) {
            // add our own video stream to the screen
            navigator.mediaDevices.getUserMedia({video: true, audio: true })
                .then((stream) => {
                    // add your own video to the list of videos
                    addVideoStream(stream, userId, true);
                })
                .catch((e) => {
                    alert('Error accessing camera and microphone');
                    console.log('Error getting user media', e);
                });
        }
    }, [userId]);

    useEffect(() => {
        if (userId && userName) {
            // data of this user
            const userData = {
                socketId: userId,
                roomId: roomCode,
                name: userName,
                status: k_connected_status
            };

            // setup peer connection
            const peer = new Peer(userId, {
                // host: "web-video-chat-peer-server-v2.herokuapp.com",
                'iceServers': [
                    {url: 'stun:stun.l.google.com:19302'},
                    {url: 'turn:numb.viagenie.ca:3478', credential: 'muazkh', username: 'web...@live.com'},
                    {url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'web...@live.com'},
                    {
                        url: 'turn:192.158.29.39:3478?transport=udp',
                        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        username: '28224511:1379330808'
                    },
                    {
                        url: 'turn:192.158.29.39:3478?transport=tcp',
                        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        username: '28224511:1379330808'
                    }
                ]
            })

            // setup socket connection
            // const socket = process.env.REACT_APP_ENV === "PRODUCTION" ? socketIOClient(API_ENDPOINT, {secure: true}) : socketIOClient(API_ENDPOINT, {secure: true});
            const socket = process.env.REACT_APP_ENV === "PRODUCTION" ? socketIOClient(API_ENDPOINT, {secure: true}) : socketIOClient(API_ENDPOINT, {secure: false});

            // function to call other peers
            const callPeer = (id) => {
                navigator.mediaDevices.getUserMedia({video: true, audio: true})
                    .then((stream) => {
                        // console.log('our video stream we will send', stream);

                        // attempt to call the other person with this stream
                        let call = peer.call(id, stream);

                        call.on('stream', (remoteStream) => {
                            // TODO: this is the video of the new peer - display it?
                            // console.log('stream from person I called', remoteStream);
                            addVideoStream(remoteStream, id);

                            // let all other clients know about the data of this user
                            socket.emit("update", userData);
                        });
                    })
                    .catch((e) => {
                        console.log('Error calling', e);
                    });
            }

            // setup peer listeners
            // peer connection opens
            peer.on('open', (myPeerId) => {
                // inform other clients about your peer id
                // console.log('my peer id', myPeerId);
                socket.emit('peer-id-offer', {id: myPeerId}); // send your peerid to other users in the room via socket.io
            });

            // handle receiving call from other clients in the room
            peer.on('call', (call) => {
                // send your own stream for the caller and add the caller stream to your page
                navigator.mediaDevices.getUserMedia({video: true, audio: true})
                    .then((stream) => {
                        // console.log('our video stream we will respond with', stream);

                        call.answer(stream);
                        call.on('stream', (remoteStream) => {
                            // console.log('stream from person who called me', remoteStream);
                            addVideoStream(remoteStream, call.peer);

                            // let all other clients know about the data of this user
                            socket.emit("update", userData);
                        })

                    })
                    .catch((e) => {
                        console.log('Error answering call', e);
                    });
            })

            // setup socket listeners
            // listener for new peerjs id
            socket.on('peer-id-received', (data) => {
                // console.log('received peer id', data.id);
                const newPeerId = data.id;
                callPeer(newPeerId);
            });

            // listener for chat messages
            socket.on("chat-message", (data) => {
                // console.log('chat message', data);
                const chatMessagesCopy = chatMessages;
                chatMessagesCopy.push(data);
                setChatMessages([...chatMessagesCopy]);
            });

            // listener for people who disconnect
            socket.on("user-disconnected", (data) => {
                // console.log('user disconnected', data);
                // remove video stream
                try {
                    const disconnectedSocketId = data.socketId;
                    const remoteStreamsCopy = remoteStreams;
                    delete remoteStreamsCopy[disconnectedSocketId];
                    setRemoteStreams(Object.assign({}, remoteStreamsCopy));
                } catch (err) {
                    console.warn('error removing user video stream', err);
                }

                // update their client info as disconnected
                try {
                    const disconnectedSocketId = data.socketId;
                    const clientsCopy = clients;
                    clientsCopy[disconnectedSocketId].status = k_disconnected_status;
                    setClients(Object.assign({}, clientsCopy));
                } catch (err) {
                    console.warn('error updating user status', err);
                }
            });

            // listener for when a user updates their information (name, etc.)
            socket.on("user-update", (data) => {
                // console.log('user updated their info', data);
                const clientsCopy = clients;
                clientsCopy[data.socketId] = data;
                setClients(Object.assign({}, clientsCopy));
            });

            if (true) {
                // console.log("adding device data listener");
                socket.on("device-data", (data) => {
                    // console.log("got new data: ", data);
                    // console.log("got device data: ", data);
                    if (data.ekg && data.time) {
                        const MAX_LENGTH = 100;
                        const newLabels = labels;
                        newLabels.push(data.time);
                        while (newLabels.length > MAX_LENGTH) {
                            newLabels.shift();
                        }
                        setLabels([...newLabels])

                        const newData = data1;
                        newData.push(data.ekg);
                        while (newData.length > MAX_LENGTH) {
                            newData.shift();
                        }
                        setData([...newData])

                        // console.log('new lengths: ', newLabels.length, newData.length);
                    }
                    if (data.heartRate) {
                        setHeartRate(data.heartRate);
                    }
                    if (data.temperature) {
                        setTemperature(data.temperature);
                    }
                    if (data.spo2) {
                        setOximetry(data.spo2);
                    }
                    if (data.thermalCameraImage) {
                        setThermalImageData(data.thermalCameraImage);
                    }
                });
            }

            // join the socket room
            socket.emit("join-room", userData);

            // let all other clients know about the data of this user
            socket.emit("update", userData);

            // set state variable
            setSocketHandler(socket);

            return () => {
                socketHandler.close();
                peer.disconnect();
            };
        }
    }, [userId, userName])

    // render the page
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                bgcolor: 'background.default',
                color: 'text.primary'
            }}
        >
            <Grid container direction={"row"} spacing={0} sx={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
            }}>
                <VideoFeeds setShowThermalImage={setShowThermalImage} showThermalImage={showThermalImage} thermalImageData={thermalImageData} isDoctor={isDoctor} data={data1} labels={labels} heartRate={heartRate} temperature={temperature} oximetry={oximetry} userId={userId} clients={clients} myVideoRef={myVideoRef} remoteStreams={remoteStreams}/>
                <Chat clients={clients} chatMessages={chatMessages} socketHandler={socketHandler} userId={userId}/>
            </Grid>
        </Box>
    );
}

const VideoFeeds = (props) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Patient Data',
            }
        },
        animation: {
            duration: 0
        }
    };

    const data = {
        labels: props.labels,
        datasets: [
            {
                label: 'EKG',
                data: props.data,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ],
    };

    return (
        <Grid item xs={9}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '60%',
                    color: 'text.primary'
                }}
            >
                <div className="video-feeds-wrapper">
                    {
                        Object.keys(props.remoteStreams).map((remoteStreamId) => {
                            const remoteStream = props.remoteStreams[remoteStreamId];
                            const client = props.clients[remoteStreamId];

                            if (props.userId !== client?.socketId && props.showThermalImage) {
                                // show thermal image data
                                return (
                                    <div key={remoteStreamId} className="video-feed depth-shadow">
                                        <img style={{width: "100%"}} alt={'thermal camera image'} src={props.thermalImageData}/>
                                        {/*<Video remoteStream={remoteStream} muted={props.userId === remoteStreamId}/>*/}
                                        <Typography sx={{textAlign: 'center', marginTop: '10px'}}
                                                    variant={'h6'}>{client ? client.name : 'Loading...'}</Typography>
                                        { props.isDoctor && (client?.socketId && props.userId !== client?.socketId) &&
                                            <Button onClick={() => {props.setShowThermalImage(false)}} style={{width: "100%"}}>Disable Thermal Camera</Button>
                                        }
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={remoteStreamId} className="video-feed depth-shadow">
                                        <Video remoteStream={remoteStream} muted={props.userId === remoteStreamId}/>
                                        <Typography sx={{textAlign: 'center', marginTop: '10px'}}
                                                    variant={'h6'}>{client ? client.name : 'Loading...'}</Typography>
                                        { props.isDoctor &&  (client?.socketId && props.userId !== client?.socketId) &&
                                            <Button onClick={() => {props.setShowThermalImage(true)}} style={{width: "100%"}}>Enable Thermal Camera</Button>
                                        }
                                    </div>
                                );
                            }
                        })
                    }
                </div>
            </Box>
            {/*Dashboard*/}
            {
                props.isDoctor && (<Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'calc(100% - 20px)',
                        height: 'calc(40% - 40px)',
                        bgcolor: 'white',
                        color: 'text.primary',
                        marginTop: '20px',
                        marginLeft: '20px',
                        marginBottom: '20px',
                        borderRadius: '5px'
                    }}
                    className={'depth-shadow'}
                >
                    <div style={{width: "100%", display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center", justifyContent: "center"}}>
                        <div style={{display: "flex", flexGrow: 0.6, flexDirection: "column", alignItems: "center", alignContent: "center", justifyContent: "center"}}>
                            <div style={{width: "70%"}}>
                                <Line options={options} data={data} />
                            </div>
                        </div>
                        <div style={{display: "flex", flexGrow: 0.4, flexDirection: "column", alignItems: "center", alignContent: "center", justifyContent: "center"}}>
                            <div style={{width: "100%", maxWidth: "150px", display: "flex", flexDirection: "row", columnGap: "10px"}}>
                                <p style={{textAlign: 'left', width: '50px'}}><strong>HR</strong></p>
                                <p style={{textAlign: 'right', flexGrow: 1.0}}>{props.heartRate} BPM</p>
                            </div>
                            <div style={{width: "100%", maxWidth: "150px", display: "flex", flexDirection: "row", columnGap: "10px"}}>
                                <p style={{textAlign: 'left', width: '50px'}}><strong>TEMP</strong></p>
                                <p style={{textAlign: 'right', flexGrow: 1.0}}>{props.temperature} ºF</p>
                            </div>
                            <div style={{width: "100%", maxWidth: "150px", display: "flex", flexDirection: "row", columnGap: "10px"}}>
                                <p style={{textAlign: 'left', width: '50px'}}><strong>SPO2</strong></p>
                                <p style={{textAlign: 'right', flexGrow: 1.0}}>{props.oximetry} %</p>
                            </div>
                        </div>
                    </div>
                </Box>)
            }
        </Grid>
    );
}

const Video = (props) => {
    const myVideoRef = useRef(undefined);

    useEffect(() => {
        if (myVideoRef.current) {
            myVideoRef.current.srcObject = props.remoteStream;
            myVideoRef.current.muted = props.muted ? true : false;
            myVideoRef.current.addEventListener("loadedmetadata", () => { // When all the metadata has been loaded
                myVideoRef.current.play(); // Play the video
            });
            myVideoRef.current.onloadedmetadata = (e) => {
                myVideoRef.current.play();
            };
        }
    }, [myVideoRef.current]);

    return (
        <video controls={false} playsInline width="100%" height="240" id={'client id'} style={{width: '100%'}} ref={myVideoRef}/>
    );
}

const Chat = (props) => {
    const [message, setMessage] = useState('');

    // function to send a message
    const sendMessage = (message) => {
        // prevent empty message from being sent
        if (message || message.trim().length > 0) {
            if (props.socketHandler) {
                // emit message to socket server
                props.socketHandler.emit('chat-message', {
                    guid: uuidV4(),
                    socketId: props.userId,
                    message: message
                });

                // clear text field after sending message
                setMessage('');
            } else {
                console.warn('socket handler not defined, unable to send message');
            }
        }
    }

    return (
        <Grid item xs={3}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'calc(100% - 40px)',
                    height: 'calc(100% - 40px)',
                    maxHeight: '100vh',
                    bgcolor: 'white',
                    marginRight: '20px',
                    marginTop: '20px',
                    marginBottom: '20px',
                    marginLeft: '20px',
                    borderRadius: '5px'
                }}
                className={'depth-shadow'}
            >
                {/*List of messages*/}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        flexGrow: 1,
                        width: '100%',
                        color: 'text.primary',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    {
                        props.chatMessages.map((chatMessage) => {
                            const client = props.clients[chatMessage.socketId]

                            // return (
                            //     <div
                            //         key={chatMessage.guid}
                            //         style={{
                            //             width: '100%',
                            //         }}
                            //     >
                            //         <Typography>Name: {client ? client.name : 'Loading...'}</Typography>
                            //         <Typography>Message: {chatMessage.message}</Typography>
                            //         {/*grey horizontal line*/}
                            //         <div style={{
                            //             marginTop: '10px',
                            //             marginBottom: '10px',
                            //             width: '100%',
                            //             height: '2px',
                            //             background: '#6b6b6b'
                            //         }}/>
                            //     </div>
                            // );

                            if (client.socketId === props.userId) {
                                return (
                                    <div key={chatMessage.guid} className="talk-bubble tri-right btm-right-in round right-message">
                                        <div className="talktext">
                                            <p style={{color: 'white'}}>{chatMessage.message}</p>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={chatMessage.guid} className="talk-bubble tri-right btm-left-in round left-message">
                                        <div className="talktext">
                                            <p style={{color: 'black'}}>{chatMessage.message}</p>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    }
                </Box>
                {/*Input field form*/}
                <FormGroup
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        color: 'text.primary',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexGrow: 0.1,
                            width: '100%',
                            color: 'text.primary',
                            columnGap: '10px',
                            padding: '10px'
                        }}
                    >
                        <TextField id="message-input" label="Message" variant="standard" value={message}
                                   onChange={(event) => {
                                       setMessage(event.target.value);
                                   }} sx={{
                            flexGrow: 1
                        }}
                           onKeyDown={(event) => {
                               if (event.key === 'Enter') {
                                   sendMessage(message);
                               }
                           }}
                        />
                        <Button variant="contained" onClick={() => {
                            sendMessage(message)
                        }}>Send</Button>
                    </Box>
                </FormGroup>
            </Box>
        </Grid>
    );
}


export default VideoChatPage;
