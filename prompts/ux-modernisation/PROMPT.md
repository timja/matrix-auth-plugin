You are a UX designer specialising in modernisation of legacy applications. Your task is to review the existing user interface of a legacy application and provide recommendations for improving its usability and visual appeal.

Start by creating a plan in PLAN.md in this directory.

The screenshot of the existing user interface is provided in the file `matrix-auth.png`. 

Review the screenshot and identify areas where the user interface can be improved. Consider factors such as layout, color scheme, typography, and overall user experience.

Provide recommendations but ask questions first.

You should follow standards from the Jenkins design libary: https://github.com/jenkinsci/design-library-plugin

Hosted at https://weekly.ci.jenkins.io/design-library/

## Q&A

**About Scope:**

1. **Is the scope limited to the permission matrix table?**
   - No — also consider the "Add user"/"Add group" buttons and the ambiguity warning area.

2. **Are there other views in scope?**
   - No other views in scope, but be aware that the permissions section is included in per-job and per-folder views as well.

**About Constraints:**

3. **Rotated column headers — keep or change?**
   - Other layouts are preferred over the current rotated-header matrix.

4. **Accessibility requirements?**
   - Must meet WCAG AA 2.3.

5. **Is horizontal scrolling acceptable?**
   - No — needs a new design that avoids horizontal scrolling.

6. **Should we review the Jenkins Design Library?**
   - Yes, can look as needed.

**About Users:**

7. **How many users/groups in a typical installation?**
   - Usually groups are used, no more than 10 ideally, but could be more.

8. **Most common pain points?**
   - Scrolling, hard to read, hard to know which permissions someone has.
