import os
from dotenv import load_dotenv
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

load_dotenv()
hf_token = os.getenv("hf_token")
os.environ["HUGGINGFACEHUB_PROVIDER"] = "auto"


def load_text_generator(repo_id="HuggingFaceH4/zephyr-7b-beta", token=os.getenv("hf_token")):
    """
    Loads a cloud-based text generation model from Hugging Face Inference API
    using LangChain's HuggingFaceEndpoint. No model download needed.
    """
    try:
        llm = HuggingFaceEndpoint(
            repo_id=repo_id,
            task="text-generation",
            huggingfacehub_api_token=token
        )
        model = ChatHuggingFace(llm=llm)
        print(f"✅ Connected to Hugging Face model: {repo_id}")
        return model
    except Exception as e:
        print(f"❌ Failed to connect to Hugging Face endpoint: {e}")
        return None

def generate_followup_message(lead, score, sentiment_score, intent_detected, generator):
    """
    Generates a personalized follow-up message (not full email),
    based on lead profile, score, sentiment, and intent.
    """
    name = lead.get('name', 'there')
    industry = lead.get('industry', 'an unspecified industry')
    job_role = lead.get('job_role', 'a potential customer')
    company_size = lead.get('company_size', 'an unknown-sized company')

    score_label = "Hot" if score > 70 else "Warm" if score > 40 else "Cold"
    sentiment_label = "positive" if sentiment_score > 0 else "neutral/negative"
    intent_label = "strong" if intent_detected else "unclear"

    # Prompt
    prompt = f"""
    Write a professional, concise follow-up email for a potential lead.

    Lead Info:
    - Name: {name}
    - Industry: {industry}
    - Role: {job_role}
    - Company Size: {company_size}
    - Lead Score: {score:.2f} ({score_label})
    - Sentiment: {sentiment_label}
    - Intent: {intent_label}

    Requirements:
    - Keep it professional and personalized
    - Maximum 3-4 sentences
    - No hashtags, no promotional text
    - No extra formatting or tags
    - End with a clear call to action
    """

    try:
        response = generator.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"❌ Error generating message: {e}")
        return "Sorry, we couldn't generate a follow-up at this time."
