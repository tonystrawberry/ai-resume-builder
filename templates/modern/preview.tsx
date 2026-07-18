"use client";

import { skillProficiencyLabel } from "@/lib/resume/skill-proficiency";
import { EntryLogoSlot } from "@/components/profile/entry-logo-slot";
import { ProfilePhotoSlot } from "@/components/profile/profile-photo-slot";
import { InlineText } from "@/components/preview/inline-text";
import { ProjectSection } from "@/templates/shared/project-section";
import type { ResumePreviewProps } from "@/templates/shared/preview-props";

export function ModernPreview({
  data,
  locale = "en",
  profileId,
  editable = false,
  textEditable = false,
  onMediaChanged,
  onPatch,
}: ResumePreviewProps) {
  const canEdit = Boolean(textEditable && onPatch);

  return (
    <article className="w-full overflow-hidden bg-white text-foreground">
      <header
        data-resume-block
        className="resume-theme-header flex items-center gap-5 px-8 py-8"
      >
        <ProfilePhotoSlot
          profileId={profileId}
          initialPhotoUrl={data.identity.photoUrl}
          editable={editable}
          variant="modern"
          onChanged={() => onMediaChanged?.()}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <InlineText
            as="h1"
            className="text-3xl font-semibold tracking-tight"
            inputClassName="text-3xl font-semibold tracking-tight text-foreground"
            value={data.identity.fullName}
            editable={canEdit}
            placeholder="Your name"
            onCommit={(fullName) =>
              onPatch?.({ identity: { ...data.identity, fullName } })
            }
          />
          <InlineText
            as="p"
            className="text-base font-medium opacity-95"
            inputClassName="text-base font-medium text-foreground"
            value={data.identity.headline ?? ""}
            editable={canEdit}
            emptyLabel="Add a professional title"
            placeholder="e.g. Ruby on Rails Engineer — Spacely Inc"
            onCommit={(headline) =>
              onPatch?.({
                identity: {
                  ...data.identity,
                  headline: headline || undefined,
                },
              })
            }
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm opacity-90">
            <InlineText
              value={data.identity.email ?? ""}
              editable={canEdit}
              emptyLabel="email"
              inputClassName="text-sm text-foreground"
              placeholder="email@example.com"
              onCommit={(email) =>
                onPatch?.({
                  identity: { ...data.identity, email: email || undefined },
                })
              }
            />
            <span className="opacity-50 print:hidden">·</span>
            <InlineText
              value={data.identity.location ?? ""}
              editable={canEdit}
              emptyLabel="location"
              inputClassName="text-sm text-foreground"
              placeholder="City, Country"
              onCommit={(location) =>
                onPatch?.({
                  identity: {
                    ...data.identity,
                    location: location || undefined,
                  },
                })
              }
            />
          </div>
        </div>
      </header>
      <div className="grid gap-8 px-8 py-8 md:grid-cols-[1fr_2fr]">
        <aside className="space-y-6">
          <section className="resume-section">
            <h2
              data-resume-block
              data-resume-keep-with-next
              className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
            >
              Skills
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {data.skills.map((s) => (
                <li key={s.id} data-resume-block>
                  <InlineText
                    className="font-medium"
                    value={s.name}
                    editable={canEdit}
                    placeholder="Skill"
                    onCommit={(name) =>
                      onPatch?.({
                        skills: [{ ...s, name, provenance: "user" }],
                      })
                    }
                  />
                  {s.proficiency ? (
                    <span className="mt-0.5 block text-xs text-muted">
                      {skillProficiencyLabel(s.proficiency, locale)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          {data.education.length ? (
            <section className="resume-section">
              <h2
                data-resume-block
                data-resume-keep-with-next
                className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
              >
                Education
              </h2>
              <ul className="mt-2 space-y-3 text-sm">
                {data.education.map((ed) => (
                  <li key={ed.id} data-resume-block className="flex gap-2">
                    <EntryLogoSlot
                      profileId={profileId}
                      section="education"
                      itemId={ed.id}
                      initialLogoUrl={ed.logoUrl}
                      editable={editable}
                      onChanged={() => onMediaChanged?.()}
                    />
                    <div>
                      <InlineText
                        as="p"
                        className="font-medium"
                        value={ed.institution}
                        editable={canEdit}
                        placeholder="School"
                        onCommit={(institution) =>
                          onPatch?.({
                            education: [
                              { ...ed, institution, provenance: "user" },
                            ],
                          })
                        }
                      />
                      <p className="text-muted">
                        <InlineText
                          value={ed.degree ?? ""}
                          editable={canEdit}
                          emptyLabel="degree"
                          placeholder="Degree"
                          onCommit={(degree) =>
                            onPatch?.({
                              education: [
                                {
                                  ...ed,
                                  degree: degree || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                        <span>, </span>
                        <InlineText
                          value={ed.field ?? ""}
                          editable={canEdit}
                          emptyLabel="field"
                          placeholder="Field"
                          onCommit={(field) =>
                            onPatch?.({
                              education: [
                                {
                                  ...ed,
                                  field: field || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                      </p>
                      <p className="text-xs text-muted">
                        <InlineText
                          value={ed.startDate ?? ""}
                          editable={canEdit}
                          emptyLabel="start"
                          placeholder="YYYY"
                          onCommit={(startDate) =>
                            onPatch?.({
                              education: [
                                {
                                  ...ed,
                                  startDate: startDate || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                        <span> – </span>
                        <InlineText
                          value={ed.endDate ?? ""}
                          editable={canEdit}
                          emptyLabel="end"
                          placeholder="YYYY"
                          onCommit={(endDate) =>
                            onPatch?.({
                              education: [
                                {
                                  ...ed,
                                  endDate: endDate || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {(data.certifications ?? []).length ? (
            <section className="resume-section">
              <h2
                data-resume-block
                data-resume-keep-with-next
                className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
              >
                Certifications
              </h2>
              <ul className="mt-2 space-y-2 text-sm">
                {(data.certifications ?? []).map((c) => (
                  <li key={c.id} data-resume-block className="flex gap-2">
                    <EntryLogoSlot
                      profileId={profileId}
                      section="certifications"
                      itemId={c.id}
                      initialLogoUrl={c.logoUrl}
                      editable={editable}
                      onChanged={() => onMediaChanged?.()}
                    />
                    <div className="min-w-0">
                      <InlineText
                        as="p"
                        className="font-medium"
                        value={c.name}
                        editable={canEdit}
                        placeholder="Certification"
                        onCommit={(name) =>
                          onPatch?.({
                            certifications: [
                              { ...c, name, provenance: "user" },
                            ],
                          })
                        }
                      />
                      <p className="text-xs text-muted">
                        <InlineText
                          value={c.issuer ?? ""}
                          editable={canEdit}
                          emptyLabel="issuer"
                          placeholder="Issuer"
                          onCommit={(issuer) =>
                            onPatch?.({
                              certifications: [
                                {
                                  ...c,
                                  issuer: issuer || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                        <span> · </span>
                        <InlineText
                          value={c.date ?? ""}
                          editable={canEdit}
                          emptyLabel="date"
                          placeholder="YYYY"
                          onCommit={(date) =>
                            onPatch?.({
                              certifications: [
                                {
                                  ...c,
                                  date: date || undefined,
                                  provenance: "user",
                                },
                              ],
                            })
                          }
                        />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {(data.references ?? []).length ? (
            <section className="resume-section">
              <h2
                data-resume-block
                data-resume-keep-with-next
                className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
              >
                References
              </h2>
              <ul className="mt-2 space-y-3 text-sm">
                {(data.references ?? []).map((r) => (
                  <li key={r.id} data-resume-block>
                    <InlineText
                      as="p"
                      className="font-medium"
                      value={r.name}
                      editable={canEdit}
                      placeholder="Name"
                      onCommit={(name) =>
                        onPatch?.({
                          references: [{ ...r, name, provenance: "user" }],
                        })
                      }
                    />
                    <p className="text-muted">
                      <InlineText
                        value={r.role ?? ""}
                        editable={canEdit}
                        emptyLabel="role"
                        placeholder="Role"
                        onCommit={(role) =>
                          onPatch?.({
                            references: [
                              {
                                ...r,
                                role: role || undefined,
                                provenance: "user",
                              },
                            ],
                          })
                        }
                      />
                      <span> · </span>
                      <InlineText
                        value={r.company ?? ""}
                        editable={canEdit}
                        emptyLabel="company"
                        placeholder="Company"
                        onCommit={(company) =>
                          onPatch?.({
                            references: [
                              {
                                ...r,
                                company: company || undefined,
                                provenance: "user",
                              },
                            ],
                          })
                        }
                      />
                    </p>
                    <InlineText
                      as="p"
                      className="text-xs text-muted"
                      value={r.email ?? ""}
                      editable={canEdit}
                      emptyLabel="email"
                      placeholder="email"
                      onCommit={(email) =>
                        onPatch?.({
                          references: [
                            {
                              ...r,
                              email: email || undefined,
                              provenance: "user",
                            },
                          ],
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
        <div className="space-y-6">
          {(data.summary || canEdit) ? (
            <section data-resume-block className="resume-section">
              <h2 className="resume-theme-heading text-xs font-semibold uppercase tracking-wider">
                Profile
              </h2>
              <InlineText
                as="p"
                multiline
                className="mt-2 text-sm leading-relaxed"
                value={data.summary ?? ""}
                editable={canEdit}
                emptyLabel="Add a short professional summary"
                placeholder="Write a concise summary…"
                onCommit={(summary) => onPatch?.({ summary })}
              />
            </section>
          ) : null}
          <section className="resume-section">
            <h2
              data-resume-block
              data-resume-keep-with-next
              className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
            >
              Experience
            </h2>
            <div className="mt-3 space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} data-resume-block className="flex gap-3">
                  <EntryLogoSlot
                    profileId={profileId}
                    section="experience"
                    itemId={exp.id}
                    initialLogoUrl={exp.logoUrl}
                    editable={editable}
                    onChanged={() => onMediaChanged?.()}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      <InlineText
                        value={exp.title}
                        editable={canEdit}
                        placeholder="Title"
                        onCommit={(title) =>
                          onPatch?.({
                            experience: [
                              { ...exp, title, provenance: "user" },
                            ],
                          })
                        }
                      />
                      <span> @ </span>
                      <InlineText
                        value={exp.company}
                        editable={canEdit}
                        placeholder="Company"
                        onCommit={(company) =>
                          onPatch?.({
                            experience: [
                              { ...exp, company, provenance: "user" },
                            ],
                          })
                        }
                      />
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {exp.bullets.map((b, i) => (
                        <li key={`b-${i}`}>
                          <InlineText
                            value={b}
                            editable={canEdit}
                            placeholder="Bullet"
                            onCommit={(next) => {
                              const bullets = [...exp.bullets];
                              if (!next.trim()) bullets.splice(i, 1);
                              else bullets[i] = next;
                              onPatch?.({
                                experience: [
                                  { ...exp, bullets, provenance: "user" },
                                ],
                              });
                            }}
                          />
                        </li>
                      ))}
                      {exp.metrics.map((m, i) => (
                        <li key={`m-${i}`}>
                          <InlineText
                            value={m}
                            editable={canEdit}
                            placeholder="Metric"
                            onCommit={(next) => {
                              const metrics = [...exp.metrics];
                              if (!next.trim()) metrics.splice(i, 1);
                              else metrics[i] = next;
                              onPatch?.({
                                experience: [
                                  { ...exp, metrics, provenance: "user" },
                                ],
                              });
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {data.projects.length ? (
            <section className="resume-section">
              <h2
                data-resume-block
                data-resume-keep-with-next
                className="resume-theme-heading text-xs font-semibold uppercase tracking-wider"
              >
                Projects
              </h2>
              <div data-resume-block>
                <ProjectSection
                  projects={data.projects}
                  textEditable={canEdit}
                  onPatch={onPatch}
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
