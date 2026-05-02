"""Flask app exposing the ai-summary service."""
from flask import Flask, request, jsonify
from anthropic_summarizer import summarize_event
from session_summarizer import summarize_session

app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/summarize-event", methods=["POST"])
def summarize_event_endpoint():
    """Analyze a single camera event and return AI commentary."""
    event_data = request.get_json()
    try:
        result = summarize_event(event_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/summarize-session", methods=["POST"])
def summarize_session_endpoint():
    """Aggregate multiple events into a session summary."""
    body = request.get_json()
    events = body.get("events", [])
    session_context = body.get("session_context")
    try:
        result = summarize_session(events, session_context)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)