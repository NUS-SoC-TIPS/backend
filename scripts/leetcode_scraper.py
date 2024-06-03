# Credits to Christopher Goh: https://github.com/chrisgzf

import json

import requests

endpoint = "https://leetcode.com/graphql/"
skip = 0
limit = 4000  # as of time of writing, there are 3172 questions on LC

gqlQuery = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    questions: data {
      id: questionFrontendId
      name: title
      difficulty
      slug: titleSlug
      isPremium: isPaidOnly
    }
  }
}
"""

# There are questions that belong to more than one category. For now, we will
# consider in this order of precedence, i.e. a question in both "database"
# and "pandas" will be considered as a "database" question.
categorySlugs = ["algorithms", "database", "shell", "concurrency", "javascript", "pandas"]
operationName = "problemsetQuestionList"

allQuestions = {}

for categorySlug in categorySlugs:
    variables = {"categorySlug": categorySlug, "skip": skip, "limit": limit, "filters": {}}
    print(f"Fetching from LC GQL API for {categorySlug}...")
    response = requests.post(
        endpoint,
        json={"query": gqlQuery, "variables": variables, "operationName": operationName},
        headers={"Content-Type": "application/json"},
    )
    print(f"Completed with response code: {response.status_code}")
    print("Note: GQL 200 does not mean error-free.")

    questions = response.json()["data"]["problemsetQuestionList"]["questions"]
    print(f"Total questions fetched for {categorySlug}: {len(questions)}")

    categorySlugUpperCase = categorySlug.upper()
    numAdded = 0
    for question in questions:
        question["id"] = int(question["id"])
        if question["id"] in allQuestions:
            # We've seen this question before in an earlier category
            continue
        question["difficulty"] = question["difficulty"].upper()
        question["type"] = categorySlugUpperCase
        allQuestions[question["id"]] = question
        numAdded += 1

    print(f"Found {numAdded} new questions for {categorySlug}\n")

with open("leetCode.json", "w") as f:
    json.dump(sorted(list(allQuestions.values()), key = lambda x: x["id"]), f, indent=2)

print(f"Done! Wrote {len(allQuestions)} questions to leetCode.json")
