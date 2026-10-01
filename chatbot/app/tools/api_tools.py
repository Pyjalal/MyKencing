"""Tools backed by the MyMedix API: medicine search/lookup and Stockley interaction checks."""
import httpx
from langchain_core.tools import tool

from .sources import SourceRegistry

UNAVAILABLE = "UNAVAILABLE"


def build_api_tools(client: httpx.AsyncClient, registry: SourceRegistry) -> list:
    @tool
    async def search_medicines(query: str) -> str:
        """Search Malaysian registered medicines (NPRA registry) by brand or generic name.
        Returns registration numbers, names, active ingredients, strength and dosage form."""
        try:
            r = await client.get("/api/medicines/search", params={"q": query, "limit": 5})
            r.raise_for_status()
            results = r.json().get("results", [])
        except Exception as e:  # noqa: BLE001 - surface any failure to the model honestly
            return f"{UNAVAILABLE}: medicine search failed ({type(e).__name__}). Tell the user you could not look it up."
        if not results:
            return f"No registered medicine found matching '{query}'."
        lines = []
        for m in results[:5]:
            sid = registry.add("medicine", m["name"], m["id"], section=m["id"])
            ingredients = ", ".join(m.get("activeIngredients") or []) or "unknown"
            extra = " ".join(x for x in (m.get("strength"), m.get("dosageForm")) if x)
            lines.append(f"[{sid}] {m['name']} (reg. no {m['id']}) - active ingredients: {ingredients}"
                         + (f" - {extra}" if extra else ""))
        return "\n".join(lines)

    @tool
    async def get_medicine(registration_number: str) -> str:
        """Look up one Malaysian medicine by its registration number (e.g. MAL20021396AZ)."""
        try:
            r = await client.get(f"/api/medicines/{registration_number.strip().upper()}")
            if r.status_code == 404:
                return f"No medicine with registration number {registration_number}."
            r.raise_for_status()
            m = r.json()
        except Exception as e:  # noqa: BLE001
            return f"{UNAVAILABLE}: medicine lookup failed ({type(e).__name__})."
        sid = registry.add("medicine", m["name"], m["id"], section=m["id"])
        return f"[{sid}] {m['name']} (reg. no {m['id']}) - active ingredients: {', '.join(m.get('activeIngredients') or [])}"

    @tool
    async def check_interactions(ingredients: list[str]) -> str:
        """Check drug-drug interactions (Stockley's Drug Interactions) between 2-10 active
        ingredient names, e.g. ["warfarin", "paracetamol"]. Use generic ingredient names,
        not brand names (use search_medicines first to find the ingredients)."""
        names = [i.strip() for i in ingredients if i and i.strip()][:10]
        if len(names) < 2:
            return "Provide at least two active ingredients to check."
        try:
            r = await client.post("/api/interactions/ingredients/check", json={"ingredients": names})
            r.raise_for_status()
            data = r.json()
        except Exception as e:  # noqa: BLE001
            return (f"{UNAVAILABLE}: the interaction check could not be completed ({type(e).__name__}). "
                    "You MUST tell the user the check failed. Do NOT say there is no interaction.")
        interactions = data.get("interactions", [])
        if not interactions:
            sid = registry.add("interaction", f"Stockley: {' + '.join(names)}", "none:" + "|".join(sorted(names)))
            return f"[{sid}] Stockley's Drug Interactions lists no interaction between: {', '.join(names)}."
        lines = []
        for i in interactions:
            title = f"Stockley: {i['firstReactant']} + {i['secondReactant']}"
            sid = registry.add("interaction", title, i["interactionId"], section=i.get("severity"))
            lines.append(f"[{sid}] {i['firstReactant']} + {i['secondReactant']} - severity: {i.get('severity')}. "
                         f"{i.get('explanation', '')} Advice: {i.get('action', '')}")
        return "\n".join(lines)

    return [search_medicines, get_medicine, check_interactions]
