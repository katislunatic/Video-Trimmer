const videoUpload = document.getElementById("videoUpload");
const videoPreview = document.getElementById("videoPreview");
const startRange = document.getElementById("startRange");
const endRange = document.getElementById("endRange");
const trimBtn = document.getElementById("trimBtn");
const formatSelect = document.getElementById("formatSelect");

let videoFile;
let ffmpeg;
let isFFmpegLoaded = false;

// Load FFmpeg properly
async function loadFFmpeg() {
  if (!isFFmpegLoaded) {
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    isFFmpegLoaded = true;
  }
}

// Handle video upload
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

// Handle trim + download
trimBtn.addEventListener("click", async () => {
  if (!videoFile) return alert("Please upload a video first!");

  await loadFFmpeg();

  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  const duration = end - start;
  const outputFormat = formatSelect.value;

  // Write input file
  ffmpeg.FS("writeFile", "input.mp4", await FFmpeg.fetchFile(videoFile));

  const args = [
    "-ss", `${start}`,
    "-t", `${duration}`,
    "-i", "input.mp4",
  ];

  if (outputFormat === "mp3") {
    args.push("-q:a", "2", "-map", "a", "output.mp3");
  } else {
    args.push("-c", "copy", "output.mp4");
  }

  try {
    await ffmpeg.run(...args);

    const outputName = outputFormat === "mp3" ? "output.mp3" : "output.mp4";
    const data = ffmpeg.FS("readFile", outputName);
    const blob = new Blob([data.buffer], {
      type: outputFormat === "mp3" ? "audio/mpeg" : "video/mp4"
    });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Trimming error:", err);
    alert("Something went wrong while processing the video. Try a smaller file or shorter clip.");
  }
});
