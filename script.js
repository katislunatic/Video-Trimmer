const videoUpload = document.getElementById("videoUpload");
const videoPreview = document.getElementById("videoPreview");
const startRange = document.getElementById("startRange");
const endRange = document.getElementById("endRange");
const trimBtn = document.getElementById("trimBtn");
const formatSelect = document.getElementById("formatSelect");

let videoFile;
let ffmpeg;

videoUpload.addEventListener("change", (e) => {
  videoFile = e.target.files[0];
  if (videoFile) {
    const url = URL.createObjectURL(videoFile);
    videoPreview.src = url;
    videoPreview.onloadedmetadata = () => {
      startRange.max = videoPreview.duration;
      endRange.max = videoPreview.duration;
      endRange.value = videoPreview.duration;
    };
  }
});

async function loadFFmpeg() {
  if (!ffmpeg) {
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
  }
}

trimBtn.addEventListener("click", async () => {
  if (!videoFile) return alert("Please upload a video first!");

  await loadFFmpeg();

  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  const duration = end - start;
  const outputFormat = formatSelect.value;

  ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

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

  await ffmpeg.run(...args);

  const outputName = outputFormat === "mp3" ? "output.mp3" : "output.mp4";
  const data = ffmpeg.FS("readFile", outputName);

  const blob = new Blob([data.buffer], { type: outputFormat === "mp3" ? "audio/mpeg" : "video/mp4" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = outputName;
  a.click();
});
