import { validate } from 'class-validator';
import {
  IsValidAssetPath,
  isValidAssetPath,
  pathValidationConstants,
} from './asset-path.validation.js';

describe('AssetPathValidation', () => {
  describe('constants', () => {
    it('should have correct min and max length values', () => {
      expect(pathValidationConstants.MIN_PATH_LENGTH).toBe(1);
      expect(pathValidationConstants.MAX_PATH_LENGTH).toBe(500);
    });

    it('should have proper regex patterns', () => {
      expect(pathValidationConstants.ALLOWED_CHARS).toBeInstanceOf(RegExp);
      expect(pathValidationConstants.DISALLOWED_PATTERNS).toBeInstanceOf(Array);
      expect(pathValidationConstants.DISALLOWED_PATTERNS).toHaveLength(3);
    });
  });

  describe('isValidAssetPath', () => {
    describe('valid paths', () => {
      it('should return true for simple valid paths', () => {
        expect(isValidAssetPath('/')).toBe(true);
        expect(isValidAssetPath('/projects')).toBe(true);
        expect(isValidAssetPath('/projects/My Project')).toBe(true);
        expect(isValidAssetPath('projects')).toBe(true);
        expect(isValidAssetPath('projects/images')).toBe(true);
      });

      it('should return true for paths with various allowed characters', () => {
        expect(isValidAssetPath('/projects/my-project')).toBe(true);
        expect(isValidAssetPath('/projects/my_project')).toBe(true);
        expect(isValidAssetPath('/projects/my.project')).toBe(true);
        expect(isValidAssetPath('/projects/my (project)')).toBe(true);
        expect(isValidAssetPath('/projects/my[project]')).toBe(true);
        expect(isValidAssetPath('/projects/2023-images')).toBe(true);
      });

      it('should return true for paths with spaces', () => {
        expect(isValidAssetPath('/projects/My Project')).toBe(true);
        expect(isValidAssetPath('/My Documents')).toBe(true);
        expect(isValidAssetPath('/photos/vacation photos')).toBe(true);
      });

      it('should return true for edge case lengths', () => {
        expect(isValidAssetPath('a')).toBe(true); // exactly min length
        expect(isValidAssetPath('a'.repeat(500))).toBe(true); // exactly max length
      });
    });

    describe('invalid paths - length constraints', () => {
      it('should return false for empty or null paths', () => {
        expect(isValidAssetPath('')).toBe(false);
        expect(isValidAssetPath(null as unknown as string)).toBe(
          false
        );
        expect(isValidAssetPath(undefined as unknown as string)).toBe(
          false
        );
      });

      it('should return false for paths that are too long', () => {
        expect(isValidAssetPath('a'.repeat(501))).toBe(false);
        expect(isValidAssetPath('a'.repeat(1000))).toBe(false);
      });

      it('should return false for whitespace-only paths', () => {
        expect(isValidAssetPath('   ')).toBe(false);
        expect(isValidAssetPath('\t')).toBe(false);
        expect(isValidAssetPath('\n')).toBe(false);
      });
    });

    describe('invalid paths - security concerns', () => {
      it('should return false for path traversal attempts', () => {
        expect(isValidAssetPath('/projects/../etc')).toBe(false);
        expect(isValidAssetPath('/projects/../../etc')).toBe(false);
        expect(isValidAssetPath('../etc')).toBe(false);
        expect(isValidAssetPath('../../etc')).toBe(false);
        expect(isValidAssetPath('/projects/.../etc')).toBe(false);
      });

      it('should return false for home directory references', () => {
        expect(isValidAssetPath('~/projects')).toBe(false);
        expect(isValidAssetPath('/home/~')).toBe(false);
        expect(isValidAssetPath('/projects/~user')).toBe(false);
      });

      it('should return false for double slashes', () => {
        expect(isValidAssetPath('/projects//images')).toBe(false);
        expect(isValidAssetPath('//projects')).toBe(false);
        expect(isValidAssetPath('/projects//images//')).toBe(false);
      });
    });

    describe('invalid paths - character restrictions', () => {
      it('should return false for paths with disallowed special characters', () => {
        expect(isValidAssetPath('/projects/my@project')).toBe(false);
        expect(isValidAssetPath('/projects/my#project')).toBe(false);
        expect(isValidAssetPath('/projects/my$project')).toBe(false);
        expect(isValidAssetPath('/projects/my%project')).toBe(false);
        expect(isValidAssetPath('/projects/my&project')).toBe(false);
        expect(isValidAssetPath('/projects/my+project')).toBe(false);
        expect(isValidAssetPath('/projects/my=project')).toBe(false);
        expect(isValidAssetPath('/projects/my?project')).toBe(false);
        expect(isValidAssetPath('/projects/my|project')).toBe(false);
        expect(isValidAssetPath('/projects/my\\project')).toBe(false);
        expect(isValidAssetPath('/projects/my"project')).toBe(false);
        expect(isValidAssetPath("/projects/my'project")).toBe(false);
        expect(isValidAssetPath('/projects/my;project')).toBe(false);
        expect(isValidAssetPath('/projects/my:project')).toBe(false);
        expect(isValidAssetPath('/projects/my<project')).toBe(false);
        expect(isValidAssetPath('/projects/my>project')).toBe(false);
        expect(isValidAssetPath('/projects/my{project')).toBe(false);
        expect(isValidAssetPath('/projects/my}project')).toBe(false);
        expect(isValidAssetPath('/projects/my`project')).toBe(false);
        expect(isValidAssetPath('/projects/my!project')).toBe(false);
      });

      it('should return false for paths with control characters', () => {
        expect(isValidAssetPath('/projects/my\tproject')).toBe(false);
        expect(isValidAssetPath('/projects/my\nproject')).toBe(false);
        expect(isValidAssetPath('/projects/my\rproject')).toBe(false);
      });
    });

    describe('edge cases and normalization', () => {
      it('should handle whitespace trimming', () => {
        expect(isValidAssetPath('  /projects  ')).toBe(true);
        expect(isValidAssetPath('\t/projects\t')).toBe(true);
      });

      it('should handle non-string inputs', () => {
        expect(isValidAssetPath(123 as unknown as string)).toBe(false);
        expect(isValidAssetPath({} as unknown as string)).toBe(false);
        expect(isValidAssetPath([] as unknown as string)).toBe(false);
      });
    });
  });

  describe('IsValidAssetPath decorator', () => {
    class TestClass {
      @IsValidAssetPath()
      path: string;

      constructor(path: string) {
        this.path = path;
      }
    }

    it('should pass validation for valid paths', async () => {
      const testInstance = new TestClass('/projects/My Project');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid paths', async () => {
      const testInstance = new TestClass('/projects/../etc');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('path');
    });

    it('should fail validation for empty paths', async () => {
      const testInstance = new TestClass('');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('path');
    });

    it('should fail validation for paths with disallowed characters', async () => {
      const testInstance = new TestClass('/projects/my@project');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('path');
    });

    it('should pass validation for root path', async () => {
      const testInstance = new TestClass('/');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation for paths with spaces', async () => {
      const testInstance = new TestClass('/My Documents/Photos');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation for paths with allowed special characters', async () => {
      const testInstance = new TestClass('/projects/my-project_v2.0');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('IsValidAssetPath decorator with custom validation options', () => {
    class TestClassWithCustomMessage {
      @IsValidAssetPath({ message: 'Custom path validation message' })
      path: string;

      constructor(path: string) {
        this.path = path;
      }
    }

    it('should use custom validation message', async () => {
      const testInstance = new TestClassWithCustomMessage('/projects/../etc');
      const errors = await validate(testInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('customValidation');
      expect(errors[0].constraints?.customValidation).toBe(
        'Custom path validation message'
      );
    });
  });

  describe('real-world path scenarios', () => {
    it('should handle common project structures', () => {
      expect(isValidAssetPath('/projects')).toBe(true);
      expect(isValidAssetPath('/projects/frontend')).toBe(true);
      expect(isValidAssetPath('/projects/backend')).toBe(true);
      expect(isValidAssetPath('/projects/docs')).toBe(true);
    });

    it('should handle media organization paths', () => {
      expect(isValidAssetPath('/media')).toBe(true);
      expect(isValidAssetPath('/media/photos')).toBe(true);
      expect(isValidAssetPath('/media/videos')).toBe(true);
      expect(isValidAssetPath('/media/thumbnails')).toBe(true);
      expect(isValidAssetPath('/media/2023')).toBe(true);
      expect(isValidAssetPath('/media/2023/vacation')).toBe(true);
    });

    it('should handle user-generated content paths', () => {
      expect(isValidAssetPath('/uploads')).toBe(true);
      expect(isValidAssetPath('/uploads/users')).toBe(true);
      expect(isValidAssetPath('/uploads/temp')).toBe(true);
      expect(isValidAssetPath('/uploads/avatars')).toBe(true);
    });

    it('should handle versioned content paths', () => {
      expect(isValidAssetPath('/content/v1')).toBe(true);
      expect(isValidAssetPath('/content/v2')).toBe(true);
      expect(isValidAssetPath('/content/draft')).toBe(true);
      expect(isValidAssetPath('/content/published')).toBe(true);
    });
  });
});
