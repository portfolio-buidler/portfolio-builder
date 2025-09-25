import re

def clean_text(text: str) -> str:
    """Normalize newlines and common Unicode punctuation; remove zero-width chars.

    Matches behavior of previous CVParser._clean_text.
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.translate(str.maketrans({
        "\u00A0": " ",  # NBSP
        "\u2010": "-",  # hyphen
        "\u2011": "-",  # non-breaking hyphen
        "\u2012": "-",  # figure dash
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u2015": "-",  # horizontal bar
        "\u2212": "-",  # minus sign
    }))
    text = text.replace("\u200B", "").replace("\u200C", "").replace("\u200D", "").replace("\u00AD", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
