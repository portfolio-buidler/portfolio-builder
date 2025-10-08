import re

def clean_text(text: str | None, replace_newlines: bool = True) -> str:
    """
    Normalize text:
    - Replace escaped or actual newlines with ', ' (optional)
    - Normalize common Unicode punctuation to ASCII
    - Remove zero-width characters
    - Collapse multiple spaces/tabs
    - Returns empty string if input is None
    """
    if not text:
        return ""

    # Convert escaped newlines (\n) to actual newlines
    text = text.replace("\\n", "\n")

    # Normalize other newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace common Unicode punctuation with ASCII equivalents
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

    # Remove zero-width characters
    text = text.replace("\u200B", "").replace("\u200C", "").replace("\u200D", "").replace("\u00AD", "")

    # Collapse multiple spaces/tabs
    text = re.sub(r"[ \t]+", " ", text)

    # Replace all newlines with ', ' if requested
    if replace_newlines:
        text = re.sub(r"\n+", ", ", text)

    return text.strip()
