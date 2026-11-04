-- ================================================================
-- Seed: Unit 06 · Acting Without Agreement (module: coordinate)
-- ================================================================
--
-- Adds coordinate-module demo data to the two existing Swiss policy
-- demo projects (Einheitskasse fully populated, 36-Stunden-Woche
-- fully populated — both are strong values-based cases where
-- coordination-without-agreement is the point).
--
-- Safe to re-run: uses UPSERT on (project_id, module).
-- Looks projects up by session_token + title so we do not depend on
-- project UUIDs.
--
-- Run in Supabase SQL editor with a role that bypasses RLS
-- (service_role or postgres). Requires the DEMO_TOKEN
-- 'demo-swiss-policy-2026' to already own the two projects.
--
-- Convention matches seed-swiss-demo-cases.sql (referenced in
-- cmt-client.js). Values-preserving edit workflow: edit this file,
-- re-run.
-- ================================================================

-- ----------------------------------------------------------------
-- CASE 1 · EINHEITSKASSE (Swiss single-payer health fund)
-- ----------------------------------------------------------------
INSERT INTO change_modules (project_id, module, data)
SELECT id, 'coordinate', $$
{
  "differences": [
    {
      "id": "d1",
      "positionA_label": "Health is a public good — a single fund maximizes solidarity, ends risk selection, cuts admin waste",
      "positionA_holders": "SP, Grüne, unions, patient advocacy groups",
      "positionB_label": "Individual choice and competition between insurers drive care quality and cost discipline",
      "positionB_holders": "FDP, SVP, santésuisse, employer associations",
      "values_at_stake": "Fundamentally different beliefs about the role of the state, whether health is primarily a public good or a market good, and what actually drives quality and cost control. Decades of political conflict. No amount of dialogue converges these.",
      "unresolvable_confidence": 5
    },
    {
      "id": "d2",
      "positionA_label": "Health is a national concern — efficiency requires unified federal administration",
      "positionA_holders": "Federal policy makers, urban cantons, national parties on both sides at times",
      "positionB_label": "Cantons must retain sovereignty over health policy — this is the core of Swiss federalism",
      "positionB_holders": "Rural and conservative cantons, cantonal health directors, KdK (Konferenz der Kantonsregierungen)",
      "values_at_stake": "Constitutional identity of Swiss federalism. Not really about health at all — about whether Bern or the cantons hold the pen.",
      "unresolvable_confidence": 4
    },
    {
      "id": "d3",
      "positionA_label": "Consolidating administration under one fund is efficient — parasitic insurance jobs are not worth defending",
      "positionA_holders": "Single-payer advocates, unions in care sector",
      "positionB_label": "Tens of thousands of Swiss jobs and communities depend on the insurance sector — a moral and economic argument against destruction",
      "positionB_holders": "Insurance sector employees and their unions, employer associations, moderate parties, affected regions",
      "values_at_stake": "Moral standing of existing work, community stability, the human cost of restructuring. Cuts across the usual left-right lines.",
      "unresolvable_confidence": 4
    }
  ],
  "practices": [
    {
      "id": "p1",
      "label": "Mandatory price and quality transparency across all funds and treatment options",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Transparency exposes the inefficiency and inequity of the current fragmented market — strengthens the single-payer evidence base.",
          "sideB": true,
          "reasonB": "Informed consumer choice is the market mechanism working — transparency is what makes competition real."
        }
      },
      "confidence": 4
    },
    {
      "id": "p2",
      "label": "Uniform national digital claims and reimbursement infrastructure (as a public utility layer)",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Eliminates most of the administrative waste that single-payer would target — a partial win even without single-payer.",
          "sideB": true,
          "reasonB": "Levels the playing field so insurers compete on service and quality rather than on paperwork complexity."
        },
        "d3": {
          "sideA": true,
          "reasonA": "Shifts jobs from redundant admin toward care delivery over time — an orderly transition rather than sudden loss.",
          "sideB": true,
          "reasonB": "Reduces compliance costs, which protects the viability of the sector and its jobs."
        }
      },
      "confidence": 5
    },
    {
      "id": "p3",
      "label": "Cantonal opt-in pilot: one canton runs a regional public single-payer fund alongside the current system",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Produces real evidence that a single-payer fund works — no more speculating.",
          "sideB": true,
          "reasonB": "Preserves the market outside the pilot region — nothing is imposed nationally."
        },
        "d2": {
          "sideA": true,
          "reasonA": "Demonstrates federal-cantonal cooperation without full centralization.",
          "sideB": true,
          "reasonB": "Cantons decide, not Bern — federalism intact."
        }
      },
      "confidence": 3
    },
    {
      "id": "p4",
      "label": "Strengthen enforcement of the existing ban on risk selection and community-rating rules",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Eliminates the worst market failure of the current system — brings it closer to solidarity in practice.",
          "sideB": true,
          "reasonB": "Makes competition fair rather than gamed — the market works properly when everyone plays by the rules."
        }
      },
      "confidence": 5
    },
    {
      "id": "p5",
      "label": "Sector transition fund for insurance-sector employees moving into care-delivery, digital-health, or public-service roles",
      "bridges": {
        "d3": {
          "sideA": true,
          "reasonA": "Shows the reform is not job destruction but redirection — takes the human cost off the table.",
          "sideB": true,
          "reasonB": "Protects the people and regions dependent on the sector — dignity of work respected."
        }
      },
      "confidence": 3
    }
  ],
  "summary": "Coverage is high — all three held differences have at least one practice that both sides can genuinely back for different reasons. The strongest coordinatable practices are the uniform digital infrastructure (bridges two differences at high confidence) and the price/quality transparency and risk-selection enforcement (both effectively already law but under-enforced — the coordination is on making them real). The cantonal pilot is politically fragile but structurally elegant: it lets both sides find out what actually happens without either winning the national argument. The transition fund is the key move for the workforce difference — without it, the whole coordination is one incident away from collapse. This case can ship real practical reform without ever resolving whether Switzerland should ultimately have a single-payer system."
}
$$::jsonb
FROM projects
WHERE session_token = 'demo-swiss-policy-2026'
  AND (title ILIKE '%Einheitskasse%' OR title ILIKE '%Single Payer%' OR title ILIKE '%single payer%')
ON CONFLICT (project_id, module)
DO UPDATE SET data = EXCLUDED.data;

-- ----------------------------------------------------------------
-- CASE 2 · 36-STUNDEN-WOCHE (36-hour work week)
-- ----------------------------------------------------------------
INSERT INTO change_modules (project_id, module, data)
SELECT id, 'coordinate', $$
{
  "differences": [
    {
      "id": "d1",
      "positionA_label": "A shorter work week reflects that life is more than work — productivity gains should return to workers as time",
      "positionA_holders": "Unia, SGB, Grüne, SP, work-life balance advocates, younger workforce",
      "positionB_label": "Competitive economies require flexible, productive labor — imposed working-time reductions hurt competitiveness",
      "positionB_holders": "economiesuisse, SVP, employer associations, most SMEs, exporters",
      "values_at_stake": "Fundamentally different conceptions of what work is for and how a good economy relates to a good society. Not resolvable through economic evidence — the evidence is read differently through each frame.",
      "unresolvable_confidence": 5
    },
    {
      "id": "d2",
      "positionA_label": "A common national standard prevents a race-to-the-bottom and creates real cultural change",
      "positionA_holders": "National unions, federal SP/Grüne legislators, labor-market economists concerned with inequality",
      "positionB_label": "Health care, hospitality, and export industry cannot operate under the same rules as banking or IT — one standard does not fit",
      "positionB_holders": "Sector associations, service industries, hospitals, tourism, exporters",
      "values_at_stake": "National uniformity vs. sectoral practicality — this is genuinely difficult, not ideological. Both sides have legitimate concerns.",
      "unresolvable_confidence": 4
    },
    {
      "id": "d3",
      "positionA_label": "The state must set a floor — collective bargaining has failed too many low-wage sectors",
      "positionA_holders": "SP, Grüne, unions in weakly-organized sectors (retail, cleaning, care)",
      "positionB_label": "Swiss labor peace depends on Sozialpartnerschaft — the state must not undermine what has worked for a century",
      "positionB_holders": "Employer associations, moderate unions, FDP, Mitte, most of the labor-relations establishment",
      "values_at_stake": "The institutional character of Swiss labor relations. This is identity as much as policy — the Sozialpartnerschaft is a defining Swiss institution.",
      "unresolvable_confidence": 4
    }
  ],
  "practices": [
    {
      "id": "p1",
      "label": "Legally recognized right to disconnect outside contracted hours (email, calls, messaging)",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Dignity of non-work time — a concrete win on the boundary between life and work.",
          "sideB": true,
          "reasonB": "Clear boundaries reduce burnout and mental-health costs — good for productivity and retention."
        }
      },
      "confidence": 4
    },
    {
      "id": "p2",
      "label": "Sector-specific working-time GAV framework negotiated at national level with state facilitation",
      "bridges": {
        "d2": {
          "sideA": true,
          "reasonA": "Prevents a race to the bottom — has national teeth even where sector rules differ.",
          "sideB": true,
          "reasonB": "Recognizes real sector differences — no one-size-fits-all mandate imposed from Bern."
        },
        "d3": {
          "sideA": true,
          "reasonA": "State provides the framework and the pressure — collective bargaining alone has not been enough.",
          "sideB": true,
          "reasonB": "Sozialpartner negotiate the actual content — Sozialpartnerschaft preserved and reinforced."
        }
      },
      "confidence": 4
    },
    {
      "id": "p3",
      "label": "Universal working-time accounting standard with portability across employers",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Makes overtime, on-call, and unpaid work visible — cannot fix what you cannot see.",
          "sideB": true,
          "reasonB": "Reduces disputes, audit exposure, and legal risk — better data is better management."
        }
      },
      "confidence": 3
    },
    {
      "id": "p4",
      "label": "Voluntary 4-day-week pilot program with tax and social-insurance incentives for participating employers",
      "bridges": {
        "d1": {
          "sideA": true,
          "reasonA": "Produces evidence that shorter weeks work — takes the argument out of theory.",
          "sideB": true,
          "reasonB": "Voluntary, no mandate — the market decides which employers can and want to."
        },
        "d3": {
          "sideA": true,
          "reasonA": "State provides the incentive that unlocks change unions could not extract alone.",
          "sideB": true,
          "reasonB": "Employer choice is preserved — the state nudges, does not compel."
        }
      },
      "confidence": 3
    }
  ],
  "summary": "All three held differences are bridged at least once — coordination-without-agreement is structurally possible here. The sector-specific GAV framework is the highest-leverage practice: it bridges both the uniformity/flexibility split and the state/Sozialpartner tension. The 4-day-week pilot is the most interesting political move — it defuses the values fight over 36 hours by making it about voluntary demonstration rather than universal mandate. Right to disconnect is the low-hanging fruit that could pass this year. Real risk: any of these could be sold by unions as 'step toward 36 hours' and by employers as 'proof no mandate is needed' — the coordination survives only if the messaging (Unit 04) does not re-ignite the underlying dispute."
}
$$::jsonb
FROM projects
WHERE session_token = 'demo-swiss-policy-2026'
  AND (title ILIKE '%36-Stunden%' OR title ILIKE '%36 Stunden%' OR title ILIKE '%36-Hour%')
ON CONFLICT (project_id, module)
DO UPDATE SET data = EXCLUDED.data;

-- ================================================================
-- Verification
-- ================================================================
-- After running, inspect what was seeded:
--
--   SELECT p.title, cm.module, jsonb_array_length(cm.data->'differences') AS diffs,
--          jsonb_array_length(cm.data->'practices')   AS practices
--   FROM projects p
--   JOIN change_modules cm ON cm.project_id = p.id
--   WHERE p.session_token = 'demo-swiss-policy-2026'
--     AND cm.module = 'coordinate';
--
-- Expected: two rows, each with 3 differences and 4–5 practices.
-- ================================================================
