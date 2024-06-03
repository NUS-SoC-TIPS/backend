# Credits to Christopher Goh: https://github.com/chrisgzf

import json

import requests
from bs4 import BeautifulSoup, Tag

# CONFIGURE THIS TO MATCH LATEST PAGE NUMBER
max_kattis_page = 42

questions = []
id = 0


def parse_url(url):
    global questions, id
    response = requests.get(url)

    soup = BeautifulSoup(response.text, features="html.parser")

    # First element is Add / Remove
    # Second element is the table header
    # So we'll slice for the third element onwards. Adjust as necessary.
    page_questions = soup.find_all("tr")[2:]
    page_questions = [tr for tr in page_questions if isinstance(tr, Tag)]

    print(f"Found {len(page_questions)} questions on page {url}")
    for tr in page_questions:
        id += 1

        contents = [c for c in tr.contents if isinstance(c, Tag)]
        name_box = contents[0]
        difficulty_box = contents[6]

        name_a = name_box.contents[0]
        name = name_a.text
        slug = name_a["href"].split("/")[2]
        difficulty = difficulty_box.contents[1].text.upper()

        question = {
            # The ID is quite arbitrary since there's no obvious source of ID on Kattis
            "id": id,
            "name": name,
            "difficulty": difficulty,
            "slug": slug,
            "isPremium": False,
            "type": "ALGORITHMS",
            "source": "KATTIS",
        }
        questions.append(question)


for i in range(max_kattis_page):
    url = f"https://open.kattis.com/problems?page={i + 1}"
    parse_url(url)

with open("kattis.json", "w") as f:
    json.dump(questions, f, indent=2)
