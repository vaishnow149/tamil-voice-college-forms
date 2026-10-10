const form = document.getElementById("collegeForm");

const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");

const openFormButton = document.getElementById("openForm");
const headerVoiceButton = document.getElementById("headerVoice");

const startVoiceButton = document.getElementById("startVoice");
const stopVoiceButton = document.getElementById("stopVoice");

let activeRecognition = null;
let activeTarget = null;
let continuousMode = false;
let manuallyStopped = false;

function showStatus(message) {
    statusBox.textContent = message;
}

function stopRecognition() {
    manuallyStopped = true;
    continuousMode = false;

    if (activeRecognition) {
        const recognition = activeRecognition;
        activeRecognition = null;
        activeTarget = null;

        try {
            recognition.stop();
        } catch (error) {
            console.log("Recognition already stopped.");
        }
    }

    document.querySelectorAll(".mic-btn").forEach(button => {
        button.classList.remove("listening");
    });

    showStatus("குரல் பதிவு நிறுத்தப்பட்டது.");
}

function createRecognition(targetId, continuous = false) {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        showStatus(
            "இந்த browser-ல் Voice Recognition ஆதரவு இல்லை. " +
            "ஆதரவு உள்ள Chrome browser-ல் முயற்சி செய்யுங்கள்."
        );
        return;
    }

    if (activeRecognition) {
        try {
            activeRecognition.stop();
        } catch (error) {
            console.log(error);
        }
    }

    const recognition = new SpeechRecognition();

    // Tamil speech recognition
    recognition.lang = "ta-IN";

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = continuous;

    activeRecognition = recognition;
    activeTarget = targetId;

    continuousMode = continuous;
    manuallyStopped = false;

    if (targetId) {
        const targetButton = document.querySelector(
            `.mic-btn[data-target="${targetId}"]`
        );

        if (targetButton) {
            targetButton.classList.add("listening");
        }
    }

    showStatus("கேட்கிறது... இப்போது தமிழில் பேசுங்கள்.");

    recognition.onresult = function(event) {
        const spokenText = event.results[
            event.results.length - 1
        ][0].transcript.trim();

        if (!spokenText) {
            return;
        }

        if (continuousMode && !targetId) {
            handleFullFormVoice(spokenText);
        } else if (targetId) {
            fillField(targetId, spokenText);
        }

        showStatus("நீங்கள் சொன்னது: " + spokenText);
    };

    recognition.onerror = function(event) {
        let message = "குரலைப் புரிந்துகொள்ள முடியவில்லை.";

        if (event.error === "not-allowed") {
            message =
                "Microphone Permission மறுக்கப்பட்டுள்ளது. " +
                "Browser Settings-ல் Microphone அனுமதியை இயக்குங்கள்.";
        } else if (event.error === "no-speech") {
            message =
                "உங்கள் குரல் கேட்கவில்லை. மீண்டும் பேசிப் பாருங்கள்.";
        } else if (event.error === "network") {
            message =
                "Network பிழை. இணைய இணைப்பைச் சரிபார்க்கவும்.";
        } else if (event.error === "audio-capture") {
            message =
                "Microphone கிடைக்கவில்லை. Mic connection-ஐச் சரிபார்க்கவும்.";
        }

        showStatus(message);
    };

    recognition.onend = function() {
        if (activeRecognition === recognition) {
            activeRecognition = null;
            activeTarget = null;
        }

        if (targetId) {
            const targetButton = document.querySelector(
                `.mic-btn[data-target="${targetId}"]`
            );

            if (targetButton) {
                targetButton.classList.remove("listening");
            }
        }

        // Continuous mode may stop after a short pause.
        // Restart it until the user presses Stop.
        if (continuous && !manuallyStopped) {
            setTimeout(() => {
                if (continuousMode && !manuallyStopped) {
                    createRecognition(null, true);
                }
            }, 400);
        }
    };

    try {
        recognition.start();
    } catch (error) {
        showStatus(
            "Voice Recognition தொடங்க முடியவில்லை. " +
            "மீண்டும் முயற்சி செய்யுங்கள்."
        );
    }
}

function fillField(targetId, spokenText) {
    const field = document.getElementById(targetId);

    if (!field) {
        return;
    }

    if (field.tagName === "SELECT") {
        const options = Array.from(field.options);

        const matchingOption = options.find(option =>
            option.value &&
            option.text.trim().toLowerCase() ===
            spokenText.trim().toLowerCase()
        );

        if (matchingOption) {
            field.value = matchingOption.value;
        } else {
            showStatus(
                "நீங்கள் சொன்னது: " + spokenText +
                ". இந்தத் தேர்வு பட்டியலில் பொருத்தம் கிடைக்கவில்லை."
            );
        }

        return;
    }

    if (field.type === "number" || field.type === "tel") {
        const digits = spokenText.replace(/\D/g, "");

        if (digits) {
            field.value = digits;
        } else {
            field.value = spokenText;
        }
    } else {
        field.value = spokenText;
    }

    field.dispatchEvent(new Event("input", {
        bubbles: true
    }));
}

function handleFullFormVoice(spokenText) {
    const text = spokenText.trim();

    // Example: "பெயர் ரமேஷ்"
    const patterns = [
        {
            words: ["என் பெயர்", "மாணவர் பெயர்", "பெயர்"],
            field: "studentName"
        },
        {
            words: ["வயது"],
            field: "age"
        },
        {
            words: ["மொபைல் எண்", "தொலைபேசி எண்", "போன் நம்பர்"],
            field: "phone"
        },
        {
            words: ["கல்லூரி பெயர்", "கல்லூரி"],
            field: "college"
        },
        {
            words: ["துறை"],
            field: "department"
        },
        {
            words: ["மாவட்டம்"],
            field: "district"
        },
        {
            words: ["முகவரி"],
            field: "address"
        },
        {
            words: ["மதிப்பெண்", "மார்க்"],
            field: "marks"
        }
    ];

    for (const item of patterns) {
        for (const word of item.words) {
            const index = text.indexOf(word);

            if (index !== -1) {
                const value = text
                    .slice(index + word.length)
                    .replace(/^[\s:,-]+/, "")
                    .trim();

                if (value) {
                    fillField(item.field, value);

                    showStatus(
                        item.field + " பகுதியில் தகவல் நிரப்பப்பட்டது. " +
                        "நீங்கள் சொன்னது: " + value
                    );

                    return;
                }
            }
        }
    }

    showStatus(
        "உங்கள் பேச்சு: " + text +
        ". சரியான விவரத்தை நிரப்ப, அந்தந்த field-ன் mic-ஐத் தொடுங்கள்."
    );
}


// Individual microphone buttons
document.querySelectorAll(".mic-btn").forEach(button => {
    button.addEventListener("click", function() {
        const targetId = this.dataset.target;

        createRecognition(targetId, false);
    });
});


// Open the form
openFormButton.addEventListener("click", function() {
    document.getElementById("formSection").scrollIntoView({
        behavior: "smooth"
    });
});


// Header voice button
headerVoiceButton.addEventListener("click", function() {
    document.getElementById("formSection").scrollIntoView({
        behavior: "smooth"
    });

    showStatus(
        "ஒவ்வொரு விவரத்திற்கும் அருகிலுள்ள 🎤 பொத்தானைத் தொட்டு பேசுங்கள்."
    );
});


// Start full-form voice mode
startVoiceButton.addEventListener("click", function() {
    createRecognition(null, true);
});


// Stop voice mode
stopVoiceButton.addEventListener("click", function() {
    stopRecognition();
});


// Submit the form
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    if (!form.reportValidity()) {
        showStatus("தயவுசெய்து தேவையான விவரங்களைச் சரியாக நிரப்புங்கள்.");
        return;
    }

    const formData = Object.fromEntries(
        new FormData(form).entries()
    );

    resultBox.className = "result";
    resultBox.textContent = "படிவம் சமர்ப்பிக்கப்படுகிறது...";

    try {
        const response = await fetch("/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "படிவத்தைச் சமர்ப்பிக்க முடியவில்லை."
            );
        }

        resultBox.className = "result success";
        resultBox.textContent = data.message;

        showStatus("படிவம் வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது.");

    } catch (error) {
        resultBox.className = "result error";

        resultBox.textContent =
            error.message ||
            "சேவையகத்துடன் தொடர்பு கொள்ள முடியவில்லை.";

        showStatus("சமர்ப்பிக்கும்போது பிழை ஏற்பட்டது.");
    }
});


// Reset form
form.addEventListener("reset", function() {
    resultBox.textContent = "";
    resultBox.className = "result";

    if (activeRecognition) {
        stopRecognition();
    }

    showStatus("புதிய விவரங்களை நிரப்பலாம்.");
});
