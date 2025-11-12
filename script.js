const videoUpload = document.getElementById("videoUpload");
const videoPreview = document.getElementById("videoPreview");
const startRange = document.getElementById("startRange");
const endRange = document.getElementById("endRange");
const trimBtn = document.getElementById("trimBtn");
const downloadBtn = document.getElementById("downloadBtn");
const formatSelect = document.getElementById("formatSelect");
const trimmedPreview = document.getElementById("trimmedPreview");

let videoFile;
let ffmpeg;
let outputBlob = null;
let isFFmpegLoaded = false;

// Load FFmpeg
async function loadFFmpeg() {
  if (!isFFmpegLoaded) {
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    isFFmpegLoaded = true;
  }
}

// Handle upload
videoUpload.addEventListener("change", (e) => {
  videoFile = e.target.files[0];
  if (!videoFile) return;
  const url = URL.createObjectURL(videoFile);
  videoPreview.src = url;

  videoPreview.onloadedmetadata = () => {
    startRange.max = videoPreview.duration;
    endRange.max = videoPreview.duration;
    endRange.value = videoPreview.duration;
  };
});

// Handle Trim button
trimBtn.addEventListener("click", async () => {
  if (!videoFile) return alert("Please upload a video first!");

  await loadFFmpeg();

  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  const duration = end - start;
  const outputFormat = formatSelect.value;

  ffmpeg.FS("writeFile", "input.mp4", await FFmpeg.fetchFile(videoFile));

  const args = ["-ss", `${start}`, "-t", `${duration}`, "-i", "input.mp4"];
  if (outputFormat === "mp3") {
    args.push("-q:a", "2", "-map", "a", "output.mp3");
  } else {
    args.push("-c", "copy", "output.mp4");
  }

  trimBtn.disabled = true;
  trimBtn.textContent = "Trimming...";
  downloadBtn.disabled = true;
  trimmedPreview.style.display = "none";

  try {
    await ffmpeg.run(...args);

    const outputName = outputFormat === "mp3" ? "output.mp3" : "output.mp4";
    const data = ffmpeg.FS("readFile", outputName);

    outputBlob = new Blob([data.buffer], {
      type: outputFormat === "mp3" ? "audio/mpeg" : "video/mp4",
    });

    const previewUrl = URL.createObjectURL(outputBlob);
    trimmedPreview.src = previewUrl;
    trimmedPreview.style.display = "block";

    downloadBtn.disabled = false;
    trimBtn.textContent = "Trim";
  } catch (err) {
    console.error("Trim error:", err);
    alert("Something went wrong while trimming. Try a shorter video.");
    trimBtn.textContent = "Trim";
  } finally {
    trimBtn.disabled = false;
  }
});

// Handle Download button
downloadBtn.addEventListener("click", () => {
  if (!outputBlob) return alert("No trimmed video available!");

  const outputFormat = formatSelect.value;
  const a = document.createElement("a");
  const url = URL.createObjectURL(outputBlob);

  a.href = url;
  a.download = outputFormat === "mp3" ? "trimmed.mp3" : "trimmed.mp4";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});
