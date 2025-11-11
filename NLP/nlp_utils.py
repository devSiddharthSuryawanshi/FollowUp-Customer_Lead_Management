from transformers import pipeline

sentiment_model = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
intent_model = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def extract_nlp_features_from_message(message, debug=True, intent_threshold=0.6):
    sentiment = sentiment_model(message)[0]
    sentiment_score = sentiment['score'] if sentiment['label'] == 'POSITIVE' else -sentiment['score']

    candidate_labels = ["ready to buy", "interested", "just exploring", "not interested", "complaint", "needs support"]
    intent_result = intent_model(message, candidate_labels)

    
    intent_detected = 0
    for label, score in zip(intent_result['labels'], intent_result['scores']):
        if label in ["interested", "ready to buy"] and score >= intent_threshold:
            intent_detected = 1
            break

    
    if debug:
        print("\n📩 Message:", message)
        print(f"🧠 Sentiment: {sentiment['label']} ({sentiment_score:.2f})")
        print("🧭 Intent Scores:")
        for lbl, scr in zip(intent_result['labels'], intent_result['scores']):
            print(f"  - {lbl}: {scr:.2f}")
        print("✅ Intent Detected:" if intent_detected else "❌ Intent Not Detected")

    return sentiment_score, intent_detected