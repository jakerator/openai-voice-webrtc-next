'use client';
import { Modal, Box, Button } from "@mui/material";
import { useState, useRef } from "react";
import { Camera } from "react-camera-pro";

export default function AddItemButton({ setItemName, setItemCategory }) {
  const [modalOpen, setModalOpen] = useState(false);
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Send image to backend API for prediction
  const predictItem = async (photo) => {
    try {
      const promptText = `Is there an aircraft carying pumkins on the image?`;

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, prompt: promptText })  // Send base64 image
      });
      setProcessing(false);
      if (response.ok) {
        const data = await response.json();
        let alert_message = "";
        if (data.message.object_on_image) {
          alert_message += "Nice! Object detected. \n\n" + data.message.image_desciption;
          alert(alert_message);  // Show predicted item name
          window.parent.postMessage({
            'message': 'entercode',
            'value': 'aircraft_hht'
          }, "*");
          // entering some code;
        }
        else {
          alert_message += "Sorry, but object wasn't detected on your drawing. Try again. \n\n" + data.message.image_desciption;
          alert(alert_message);  // Show predicted item name
        }



      } else {
        console.error("Prediction failed.");
      }
    } catch (error) {
      console.error("Error predicting item:", error);
    }
  };

  return (
    <>
      {/* Modal for capturing the image */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box>
          <Camera ref={camera} facingMode="environment" />
          <div className="enable-camera">
            <Button
              onClick={() => {
                const photo = camera.current.takePhoto();  // Capture base64 image
                setImage(photo);
                setProcessing(true);
                predictItem(photo);  // Send image for prediction
              }}
            >
              {processing?"Processing...":"Take Photo"}
            </Button>
          </div>
          {/* <img src={image} alt='Taken photo'/> */}
        </Box>
      </Modal>

      {/* Button to open modal */}
      <div className="enable-camera"><Button onClick={() => setModalOpen(true)} >Enable Camera</Button></div>
    </>
  );
}