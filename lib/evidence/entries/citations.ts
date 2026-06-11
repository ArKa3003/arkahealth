/**
 * Shared external citation pool for the AIIE evidence registry.
 *
 * Every citation must resolve over https to actual published guidance or
 * peer-reviewed literature (society guidelines, USPSTF, doi.org). Checked by
 * `npm run evidence:check` (scripts/check-evidence-links.ts).
 */

import type { EvidenceCitation } from "@/lib/evidence/types";

/** Builds a doi.org citation. */
function doi(label: string, source: string, year: number, id: string): EvidenceCitation {
  return { label, source, year, url: `https://doi.org/${id}`, doi: id };
}

/** Canonical external citations reused across registry entries. */
export const CIT = {
  acrAc: {
    label: "ACR Appropriateness Criteria (topic search portal)",
    source: "American College of Radiology",
    year: 2024,
    url: "https://acsearch.acr.org/list",
  } satisfies EvidenceCitation,
  randUcla: {
    label: "Fitch K, et al. The RAND/UCLA Appropriateness Method User's Manual",
    source: "RAND Corporation",
    year: 2001,
    url: "https://www.rand.org/pubs/monograph_reports/MR1269.html",
  } satisfies EvidenceCitation,

  // Spine
  acpLbp: doi(
    "Qaseem A, et al. Noninvasive treatments for acute, subacute, and chronic low back pain",
    "Annals of Internal Medicine",
    2017,
    "10.7326/M16-2367",
  ),
  chouLbpImaging: doi(
    "Chou R, et al. Imaging strategies for low-back pain: systematic review and meta-analysis",
    "The Lancet",
    2009,
    "10.1016/S0140-6736(09)60172-0",
  ),
  lancetLbp: doi(
    "Hartvigsen J, et al. What low back pain is and why we need to pay attention",
    "The Lancet",
    2018,
    "10.1016/S0140-6736(18)30480-X",
  ),
  cochraneRedFlags: doi(
    "Henschke N, et al. Red flags to screen for malignancy in patients with low-back pain",
    "Cochrane Database of Systematic Reviews",
    2013,
    "10.1002/14651858.CD008686.pub2",
  ),
  nexus: doi(
    "Hoffman JR, et al. Validity of a set of clinical criteria to rule out injury to the cervical spine (NEXUS)",
    "New England Journal of Medicine",
    2000,
    "10.1056/NEJM200007133430203",
  ),
  canadianCSpine: doi(
    "Stiell IG, et al. The Canadian C-Spine Rule for radiography in alert and stable trauma patients",
    "JAMA",
    2001,
    "10.1001/jama.286.15.1841",
  ),
  aoMyelopathy: doi(
    "Fehlings MG, et al. Clinical practice guidelines for the management of degenerative cervical myelopathy",
    "Global Spine Journal",
    2017,
    "10.1177/2192568217701914",
  ),

  // Head / brain
  canadianCtHead: doi(
    "Stiell IG, et al. The Canadian CT Head Rule for patients with minor head injury",
    "The Lancet",
    2001,
    "10.1016/S0140-6736(00)04561-X",
  ),
  newOrleans: doi(
    "Haydel MJ, et al. Indications for computed tomography in patients with minor head injury",
    "New England Journal of Medicine",
    2000,
    "10.1056/NEJM200007133430204",
  ),
  pecarn: doi(
    "Kuppermann N, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma (PECARN)",
    "The Lancet",
    2009,
    "10.1016/S0140-6736(09)61558-0",
  ),
  ottawaSah: doi(
    "Perry JJ, et al. Clinical decision rules to rule out subarachnoid hemorrhage for acute headache",
    "JAMA",
    2013,
    "10.1001/jama.2013.278018",
  ),
  acepHeadache: doi(
    "ACEP Clinical Policy: critical issues in the evaluation of adult patients presenting with acute headache",
    "Annals of Emergency Medicine",
    2019,
    "10.1016/j.annemergmed.2019.07.009",
  ),
  ahaStroke: doi(
    "Powers WJ, et al. Guidelines for the early management of patients with acute ischemic stroke (2019 update)",
    "Stroke",
    2019,
    "10.1161/STR.0000000000000211",
  ),
  ecass3: doi(
    "Hacke W, et al. Thrombolysis with alteplase 3 to 4.5 hours after acute ischemic stroke (ECASS III)",
    "New England Journal of Medicine",
    2008,
    "10.1056/NEJMoa0804656",
  ),
  wakeUp: doi(
    "Thomalla G, et al. MRI-guided thrombolysis for stroke with unknown time of onset (WAKE-UP)",
    "New England Journal of Medicine",
    2018,
    "10.1056/NEJMoa1804355",
  ),
  dawn: doi(
    "Nogueira RG, et al. Thrombectomy 6 to 24 hours after stroke with a mismatch between deficit and infarct (DAWN)",
    "New England Journal of Medicine",
    2018,
    "10.1056/NEJMoa1706442",
  ),
  tiaDefinition: doi(
    "Easton JD, et al. Definition and evaluation of transient ischemic attack (AHA/ASA scientific statement)",
    "Stroke",
    2009,
    "10.1161/STROKEAHA.108.192218",
  ),
  aanFirstSeizure: doi(
    "Krumholz A, et al. Evidence-based guideline: management of an unprovoked first seizure in adults",
    "Neurology",
    2015,
    "10.1212/WNL.0000000000001487",
  ),
  acepSeizure: doi(
    "ACEP Clinical Policy: critical issues in the evaluation and management of adult patients presenting with seizures",
    "Annals of Emergency Medicine",
    2014,
    "10.1016/j.annemergmed.2014.01.018",
  ),

  // Head, face & neck
  idsaSinusitis: doi(
    "Chow AW, et al. IDSA clinical practice guideline for acute bacterial rhinosinusitis",
    "Clinical Infectious Diseases",
    2012,
    "10.1093/cid/cis803",
  ),
  aaoSinusitis: doi(
    "Rosenfeld RM, et al. Clinical practice guideline (update): adult sinusitis",
    "Otolaryngology–Head and Neck Surgery",
    2015,
    "10.1177/0194599815572097",
  ),
  aaoNeckMass: doi(
    "Pynnonen MA, et al. Clinical practice guideline: evaluation of the neck mass in adults",
    "Otolaryngology–Head and Neck Surgery",
    2017,
    "10.1177/0194599817722550",
  ),
  tirads: doi(
    "Tessler FN, et al. ACR Thyroid Imaging, Reporting and Data System (TI-RADS)",
    "Journal of the American College of Radiology",
    2017,
    "10.1016/j.jacr.2017.01.046",
  ),
  ataThyroid: doi(
    "Haugen BR, et al. 2015 American Thyroid Association management guidelines for thyroid nodules and differentiated thyroid cancer",
    "Thyroid",
    2016,
    "10.1089/thy.2015.0020",
  ),

  // Chest / PE / cardiac
  christopherPe: doi(
    "van Belle A, et al. Effectiveness of managing suspected pulmonary embolism using clinical probability, D-dimer, and CT (Christopher Study)",
    "JAMA",
    2006,
    "10.1001/jama.295.2.172",
  ),
  perc: doi(
    "Kline JA, et al. Clinical criteria to prevent unnecessary diagnostic testing in emergency department patients with suspected pulmonary embolism (PERC)",
    "Journal of Thrombosis and Haemostasis",
    2004,
    "10.1111/j.1538-7836.2004.00790.x",
  ),
  piopedii: doi(
    "Stein PD, et al. Multidetector computed tomography for acute pulmonary embolism (PIOPED II)",
    "New England Journal of Medicine",
    2006,
    "10.1056/NEJMoa052367",
  ),
  escPe: doi(
    "Konstantinides SV, et al. 2019 ESC guidelines for the diagnosis and management of acute pulmonary embolism",
    "European Heart Journal",
    2020,
    "10.1093/eurheartj/ehz405",
  ),
  years: doi(
    "van der Hulle T, et al. Simplified diagnostic management of suspected pulmonary embolism (YEARS study)",
    "The Lancet",
    2017,
    "10.1016/S0140-6736(17)30885-1",
  ),
  chestPain2021: doi(
    "Gulati M, et al. 2021 AHA/ACC guideline for the evaluation and diagnosis of chest pain",
    "Circulation",
    2021,
    "10.1161/CIR.0000000000001029",
  ),
  aortic2022: doi(
    "Isselbacher EM, et al. 2022 ACC/AHA guideline for the diagnosis and management of aortic disease",
    "Circulation",
    2022,
    "10.1161/CIR.0000000000001106",
  ),
  scotHeart: doi(
    "SCOT-HEART Investigators. Coronary CT angiography and 5-year risk of myocardial infarction",
    "New England Journal of Medicine",
    2018,
    "10.1056/NEJMoa1805971",
  ),
  promise: doi(
    "Douglas PS, et al. Outcomes of anatomical versus functional testing for coronary artery disease (PROMISE)",
    "New England Journal of Medicine",
    2015,
    "10.1056/NEJMoa1415516",
  ),
  ischemia: doi(
    "Maron DJ, et al. Initial invasive or conservative strategy for stable coronary disease (ISCHEMIA)",
    "New England Journal of Medicine",
    2020,
    "10.1056/NEJMoa1915922",
  ),
  hf2022: doi(
    "Heidenreich PA, et al. 2022 AHA/ACC/HFSA guideline for the management of heart failure",
    "Circulation",
    2022,
    "10.1161/CIR.0000000000001063",
  ),
  periop2014: doi(
    "Fleisher LA, et al. 2014 ACC/AHA guideline on perioperative cardiovascular evaluation for noncardiac surgery",
    "Journal of the American College of Cardiology",
    2014,
    "10.1016/j.jacc.2014.07.944",
  ),
  uspstfLung: {
    label: "USPSTF Recommendation: screening for lung cancer",
    source: "U.S. Preventive Services Task Force",
    year: 2021,
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening",
  } satisfies EvidenceCitation,
  nlst: doi(
    "National Lung Screening Trial Research Team. Reduced lung-cancer mortality with low-dose CT screening",
    "New England Journal of Medicine",
    2011,
    "10.1056/NEJMoa1102873",
  ),
  accpCough: doi(
    "Irwin RS, et al. Diagnosis and management of cough: ACCP evidence-based clinical practice guidelines (executive summary)",
    "Chest",
    2006,
    "10.1378/chest.129.1_suppl.1S",
  ),

  // Abdomen
  jerusalemAppy: doi(
    "Di Saverio S, et al. Diagnosis and treatment of acute appendicitis: 2020 update of the WSES Jerusalem guidelines",
    "World Journal of Emergency Surgery",
    2020,
    "10.1186/s13017-020-00306-3",
  ),
  doriaPedsAppy: doi(
    "Doria AS, et al. US or CT for diagnosis of appendicitis in children and adults: a meta-analysis",
    "Radiology",
    2006,
    "10.1148/radiol.2411050913",
  ),
  acogPregImaging: doi(
    "ACOG Committee Opinion No. 723: guidelines for diagnostic imaging during pregnancy and lactation",
    "Obstetrics & Gynecology",
    2017,
    "10.1097/AOG.0000000000002355",
  ),
  tg18Cholecystitis: doi(
    "Yokoe M, et al. Tokyo Guidelines 2018: diagnostic criteria and severity grading of acute cholecystitis",
    "Journal of Hepato-Biliary-Pancreatic Sciences",
    2018,
    "10.1002/jhbp.515",
  ),
  acgPancreatitis: doi(
    "Tenner S, et al. American College of Gastroenterology guideline: management of acute pancreatitis",
    "American Journal of Gastroenterology",
    2013,
    "10.1038/ajg.2013.218",
  ),
  atlantaPancreatitis: doi(
    "Banks PA, et al. Classification of acute pancreatitis — 2012 revision of the Atlanta classification",
    "Gut",
    2013,
    "10.1136/gutjnl-2012-302779",
  ),
  bolognaSbo: doi(
    "Ten Broek RPG, et al. Bologna guidelines for diagnosis and management of adhesive small bowel obstruction",
    "World Journal of Emergency Surgery",
    2018,
    "10.1186/s13017-018-0185-2",
  ),
  agaDiverticulitis: doi(
    "Stollman N, et al. AGA Institute guideline on the management of acute diverticulitis",
    "Gastroenterology",
    2015,
    "10.1053/j.gastro.2015.10.003",
  ),
  ascrsDiverticulitis: doi(
    "Hall J, et al. ASCRS clinical practice guidelines for the treatment of left-sided colonic diverticulitis",
    "Diseases of the Colon & Rectum",
    2020,
    "10.1097/DCR.0000000000001679",
  ),
  fastCochrane: doi(
    "Stengel D, et al. Point-of-care ultrasonography for diagnosing thoracoabdominal injuries in patients with blunt trauma",
    "Cochrane Database of Systematic Reviews",
    2015,
    "10.1002/14651858.CD004446.pub4",
  ),

  // GU / renal
  smithBindman: doi(
    "Smith-Bindman R, et al. Ultrasonography versus computed tomography for suspected nephrolithiasis",
    "New England Journal of Medicine",
    2014,
    "10.1056/NEJMoa1404446",
  ),
  auaStones: doi(
    "Assimos D, et al. Surgical management of stones: AUA/Endourological Society guideline",
    "Journal of Urology",
    2016,
    "10.1016/j.juro.2016.05.091",
  ),
  auaHematuria: doi(
    "Barocas DA, et al. Microhematuria: AUA/SUFU guideline",
    "Journal of Urology",
    2020,
    "10.1097/JU.0000000000001297",
  ),
  twist: doi(
    "Barbosa JA, et al. Development and initial validation of a scoring system to diagnose testicular torsion (TWIST)",
    "Journal of Urology",
    2013,
    "10.1016/j.juro.2012.10.056",
  ),

  // Pelvis
  acogEctopic: doi(
    "ACOG Practice Bulletin No. 193: tubal ectopic pregnancy",
    "Obstetrics & Gynecology",
    2018,
    "10.1097/AOG.0000000000002560",
  ),
  acogPmb: doi(
    "ACOG Committee Opinion No. 734: the role of transvaginal ultrasonography in evaluating the endometrium of women with postmenopausal bleeding",
    "Obstetrics & Gynecology",
    2018,
    "10.1097/AOG.0000000000002631",
  ),

  // MSK
  ottawaAnkleReview: doi(
    "Bachmann LM, et al. Accuracy of Ottawa ankle rules to exclude fractures of the ankle and mid-foot: systematic review",
    "BMJ",
    2003,
    "10.1136/bmj.326.7386.417",
  ),
  ottawaKneeReview: doi(
    "Bachmann LM, et al. The accuracy of the Ottawa knee rule to rule out knee fractures: a systematic review",
    "Annals of Internal Medicine",
    2004,
    "10.7326/0003-4819-140-2-200401200-00013",
  ),
  oarsiOa: doi(
    "Bannuru RR, et al. OARSI guidelines for the non-surgical management of knee, hip, and polyarticular osteoarthritis",
    "Osteoarthritis and Cartilage",
    2019,
    "10.1016/j.joca.2019.06.011",
  ),
  meteor: doi(
    "Katz JN, et al. Surgery versus physical therapy for a meniscal tear and osteoarthritis (METEOR)",
    "New England Journal of Medicine",
    2013,
    "10.1056/NEJMoa1301408",
  ),
  bmjArthroscopy: doi(
    "Siemieniuk RAC, et al. Arthroscopic surgery for degenerative knee arthritis and meniscal tears: BMJ Rapid Recommendation",
    "BMJ",
    2017,
    "10.1136/bmj.j1982",
  ),
  niceHip: {
    label: "NICE Clinical Guideline CG124: hip fracture — management",
    source: "National Institute for Health and Care Excellence",
    year: 2023,
    url: "https://www.nice.org.uk/guidance/cg124",
  } satisfies EvidenceCitation,
  rotatorCuffMeta: doi(
    "Roy JS, et al. Diagnostic accuracy of ultrasonography, MRI and MR arthrography in the characterisation of rotator cuff disorders",
    "British Journal of Sports Medicine",
    2015,
    "10.1136/bjsports-2014-094148",
  ),

  // Vascular
  uspstfAaa: {
    label: "USPSTF Recommendation: screening for abdominal aortic aneurysm",
    source: "U.S. Preventive Services Task Force",
    year: 2019,
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/abdominal-aortic-aneurysm-screening",
  } satisfies EvidenceCitation,
  svsAaa: doi(
    "Chaikof EL, et al. SVS practice guidelines on the care of patients with an abdominal aortic aneurysm",
    "Journal of Vascular Surgery",
    2018,
    "10.1016/j.jvs.2017.10.044",
  ),
  nascet: doi(
    "NASCET Collaborators. Beneficial effect of carotid endarterectomy in symptomatic patients with high-grade carotid stenosis",
    "New England Journal of Medicine",
    1991,
    "10.1056/NEJM199108153250701",
  ),
  uspstfCarotid: doi(
    "USPSTF Recommendation Statement: screening for asymptomatic carotid artery stenosis",
    "JAMA",
    2021,
    "10.1001/jama.2020.26988",
  ),
  wellsDvt: doi(
    "Wells PS, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis",
    "New England Journal of Medicine",
    2003,
    "10.1056/NEJMoa023153",
  ),
  ashVte: doi(
    "Lim W, et al. American Society of Hematology 2018 guidelines for management of venous thromboembolism: diagnosis",
    "Blood Advances",
    2018,
    "10.1182/bloodadvances.2018024828",
  ),

  // Breast
  uspstfBreast: {
    label: "USPSTF Recommendation: screening for breast cancer",
    source: "U.S. Preventive Services Task Force",
    year: 2024,
    url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening",
  } satisfies EvidenceCitation,
  acsBreastMri: doi(
    "Saslow D, et al. American Cancer Society guidelines for breast screening with MRI as an adjunct to mammography",
    "CA: A Cancer Journal for Clinicians",
    2007,
    "10.3322/canjclin.57.2.75",
  ),

  // Cross-cutting
  imageGently: {
    label: "Image Gently Alliance: pediatric radiation safety in imaging",
    source: "Image Gently Alliance",
    year: 2024,
    url: "https://www.imagegently.org/",
  } satisfies EvidenceCitation,
  pearceCt: doi(
    "Pearce MS, et al. Radiation exposure from CT scans in childhood and subsequent risk of leukaemia and brain tumours",
    "The Lancet",
    2012,
    "10.1016/S0140-6736(12)60815-0",
  ),
} as const;
